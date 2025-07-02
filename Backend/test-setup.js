const fs = require('fs');
const path = require('path');

console.log('🧪 Testing HMH Global Backend Setup...\n');

// Check if all required files exist
const requiredFiles = [
    'app.js',
    'package.json',
    '.env',
    'config/appwrite.js',
    'models/Product.js',
    'models/Category.js',
    'models/User.js',
    'controllers/productController.js',
    'routes/index.js',
    'routes/productRoutes.js',
    'middleware/auth.js',
    'utils/errorHandler.js',
    'utils/validation.js',
    'README.md'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

console.log('\n📦 Checking package.json dependencies:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['express', 'cors', 'dotenv', 'appwrite'];
    
    requiredDeps.forEach(dep => {
        const exists = packageJson.dependencies && packageJson.dependencies[dep];
        console.log(`${exists ? '✅' : '❌'} ${dep}`);
        if (!exists) allFilesExist = false;
    });
} catch (error) {
    console.log('❌ Error reading package.json');
    allFilesExist = false;
}

console.log('\n🔧 Checking environment configuration:');
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredEnvVars = [
        'APPWRITE_ENDPOINT',
        'APPWRITE_PROJECT_ID',
        'APPWRITE_API_KEY',
        'APPWRITE_DATABASE_ID'
    ];
    
    requiredEnvVars.forEach(envVar => {
        const exists = envContent.includes(envVar);
        console.log(`${exists ? '✅' : '❌'} ${envVar}`);
    });
} catch (error) {
    console.log('❌ Error reading .env file');
    allFilesExist = false;
}

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 Setup Complete! Your backend is ready to use.');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your .env file with actual Appwrite credentials');
    console.log('2. Create the required collections in Appwrite');
    console.log('3. Run: npm run dev');
    console.log('4. Test the API at: http://localhost:5000');
} else {
    console.log('❌ Setup incomplete. Please check the missing files above.');
}
console.log('='.repeat(50));
