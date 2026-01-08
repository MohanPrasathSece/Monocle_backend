const fs = require('fs');
const content = `PORT=5000
MONGODB_URI=mongodb+srv://mohan:0110@cluster0.420pvti.mongodb.net/?appName=Cluster0
JWT_SECRET=dev-secret
GEMINI_API_KEY=AIzaSyDCNLYV4qq91Jyq5jp8byOCyqEckEN
GOOGLE_CLIENT_ID=636666241864-fronahev0ijj9vr0a0lue6lhuunqnp87.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=zyradigitalsofficial@gmail.com
SMTP_PASS=twer hcww esmg txjz
SMTP_SECURE=true
FRONTEND_URL=http://localhost:8080`;
fs.writeFileSync('.env', content, 'utf8');
console.log('.env file written successfully');
