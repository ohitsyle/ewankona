#!/usr/bin/env node
// Auto-update IP address in config files when starting the server

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get local IP address
function getLocalIP() {
  try {
    // macOS/Linux command to get local IP (not localhost)
    const ip = execSync("ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1")
      .toString()
      .trim();

    if (!ip) {
      console.error('❌ Could not detect local IP address');
      process.exit(1);
    }

    return ip;
  } catch (error) {
    console.error('❌ Error detecting IP:', error.message);
    process.exit(1);
  }
}

// Update .env file
function updateEnvFile(ip) {
  const envPath = path.join(__dirname, '../../.env');

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    return false;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  const regex = /API_BASE_URL=http:\/\/[\d.]+:3000\/api/;
  const newValue = `API_BASE_URL=http://${ip}:3000/api`;

  if (regex.test(content)) {
    content = content.replace(regex, newValue);
  } else {
    // If not found, append it
    if (!content.endsWith('\n')) content += '\n';
    content += newValue + '\n';
  }

  fs.writeFileSync(envPath, content);
  console.log(`✅ Updated .env: ${newValue}`);
  return true;
}

// Update mobile app config
function updateMobileConfig(ip) {
  const configPath = path.join(__dirname, '../../src/config/api.config.js');

  if (!fs.existsSync(configPath)) {
    console.error('❌ Mobile config file not found');
    return false;
  }

  let content = fs.readFileSync(configPath, 'utf8');
  const regex = /development:\s*'http:\/\/[\d.]+:3000\/api'/;
  const newValue = `development: 'http://${ip}:3000/api'`;

  if (regex.test(content)) {
    content = content.replace(regex, newValue);
    fs.writeFileSync(configPath, content);
    console.log(`✅ Updated mobile config: http://${ip}:3000/api`);
    return true;
  } else {
    console.error('⚠️ Could not find development URL pattern in mobile config');
    return false;
  }
}

// Main execution
function main() {
  console.log('\n🔍 Detecting local IP address...');
  const ip = getLocalIP();
  console.log(`📍 Detected IP: ${ip}`);

  console.log('\n🔄 Updating configuration files...');
  updateEnvFile(ip);
  updateMobileConfig(ip);

  console.log('\n✅ Configuration updated successfully!');
  console.log(`\n📱 Mobile app will connect to: http://${ip}:3000/api`);
  console.log('💡 Restart your React Native app to pick up the new IP\n');
}

main();
