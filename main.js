const fs = require('fs');
const readline = require('readline');
const bcrypt = require('bcrypt');
const { promisify } = require('util');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const saltRounds = 10;
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

let isLoggedIn = false;
let username = '';

function promptAsync(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}

function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

async function createAccount() {
  const username = await promptAsync('Enter your desired username: ');
  const password = await promptAsync('Enter your desired password: ');

  const hashedPassword = await hashPassword(password);
  const account = {
    username,
    password: hashedPassword
  };

  let accounts = [];
  try {
    const data = await readFileAsync('.accounts', 'utf8');
    accounts = JSON.parse(data);
    if (!Array.isArray(accounts)) {
      throw new Error('Invalid accounts file');
    }
  } catch (error) {
    // Ignore error if file does not exist or is empty
  }

  accounts.push(account);
  await writeFileAsync('.accounts', JSON.stringify(accounts));
  console.log('Account created successfully!');
  login();
}

async function login() {
  const username = await promptAsync('Enter your username: ');
  const password = await promptAsync('Enter your password: ');

  let accounts = [];
  try {
    const data = await readFileAsync('.accounts', 'utf8');
    accounts = JSON.parse(data);
    if (!Array.isArray(accounts)) {
      throw new Error('Invalid accounts file');
    }
  } catch (error) {
    console.log('No accounts found. Please create a new account.');
    process.exit(0);
  }

  const account = accounts.find((acc) => acc.username === username);
  if (account && (await comparePassword(password, account.password))) {
    isLoggedIn = true;
    console.log('Login successful!');
    startChat();
  } else {
    console.log('Invalid username or password. Please try again.');
    login();
  }
}

function startChat() {
  console.log('Welcome to the chat! Start sending messages.');

  rl.on('line', (input) => {
    if (input === '/exit') {
      rl.close();
    } else if (isLoggedIn) {
      console.log(`You: ${input}`);
    } else {
      console.log('Please log in first.');
    }
  });
}

async function main() {
  let accounts = [];
  try {
    const data = await readFileAsync('.accounts', 'utf8');
    accounts = JSON.parse(data);
    if (!Array.isArray(accounts)) {
      throw new Error('Invalid accounts file');
    }
  } catch (error) {
    // Ignore error if file does not exist or is empty
  }

  const menuChoice = await promptAsync('Please select an option:\n1. Create an account\n2. Log in\n');

  if (menuChoice === '1') {
    await createAccount();
  } else if (menuChoice === '2') {
    await login();
  } else {
    console.log('Invalid choice. Exiting...');
    process.exit(0);
  }
}

main();
