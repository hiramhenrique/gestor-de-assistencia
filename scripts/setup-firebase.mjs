import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function ask(question, defaultValue = '') {
  const answer = await rl.question(`${question}${defaultValue ? ` [${defaultValue}]` : ''}: `);
  return answer.trim() || defaultValue;
}

const values = {
  VITE_FIREBASE_API_KEY: await ask('API key do Firebase'),
  VITE_FIREBASE_AUTH_DOMAIN: await ask('Auth domain do Firebase'),
  VITE_FIREBASE_PROJECT_ID: await ask('Project ID do Firebase'),
  VITE_FIREBASE_STORAGE_BUCKET: await ask('Storage bucket do Firebase'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: await ask('Messaging sender ID do Firebase'),
  VITE_FIREBASE_APP_ID: await ask('App ID do Firebase'),
  VITE_USE_FIREBASE_EMULATORS: await ask('Usar emuladores Firebase? (true/false)', 'false'),
};

rl.close();

const targetPath = path.resolve(process.cwd(), '.env.local');
const content = Object.entries(values)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(targetPath, `${content}\n`, 'utf8');

console.log(`\nArquivo criado em ${targetPath}`);
console.log('Reinicie o projeto com: npm run dev');
