// nucash-server/test-routes.js
// Quick diagnostic script to test route loading

console.log('Testing route imports...\n');

try {
  console.log('1. Testing routes/user...');
  const userRoutes = require('./routes/user');
  console.log('✅ routes/user loaded:', typeof userRoutes);
} catch (e) {
  console.log('❌ routes/user failed:', e.message);
}

try {
  console.log('\n2. Testing routes/driver...');
  const driverRoutes = require('./routes/driver');
  console.log('✅ routes/driver loaded:', typeof driverRoutes);
} catch (e) {
  console.log('❌ routes/driver failed:', e.message);
}

try {
  console.log('\n3. Testing routes/admin...');
  const adminRoutes = require('./routes/admin');
  console.log('✅ routes/admin loaded:', typeof adminRoutes);
} catch (e) {
  console.log('❌ routes/admin failed:', e.message);
}

try {
  console.log('\n4. Testing routes/logs...');
  const logsModule = require('./routes/logs');
  console.log('✅ routes/logs loaded:', typeof logsModule);
  console.log('   Has router?', !!logsModule.router);
  console.log('   Has logEvent?', !!logsModule.logEvent);
} catch (e) {
  console.log('❌ routes/logs failed:', e.message);
}

try {
  console.log('\n5. Testing models/User...');
  const User = require('./models/User');
  console.log('✅ models/User loaded');
} catch (e) {
  console.log('❌ models/User failed:', e.message);
}

try {
  console.log('\n6. Testing models/Driver...');
  const Driver = require('./models/Driver');
  console.log('✅ models/Driver loaded');
} catch (e) {
  console.log('❌ models/Driver failed:', e.message);
}

try {
  console.log('\n7. Testing models/ShuttlePosition...');
  const ShuttlePosition = require('./models/ShuttlePosition');
  console.log('✅ models/ShuttlePosition loaded');
} catch (e) {
  console.log('❌ models/ShuttlePosition NOT FOUND - this is the problem!');
  console.log('   Error:', e.message);
}

console.log('\n✅ Diagnostic complete!');