const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

function runCommand(command:string, workingDir = process.cwd(), envVars = {}) {
    console.log(`Executing: ${command} in ${workingDir}`);
    try{
        const env = { ...process.env, ...envVars }; // Merge existing and additional environment variables
        const result = execSync(command, { stdio: 'inherit', cwd: workingDir, env: env });
        return result.toString();
    } catch (error) {
        console.error('Command failed:', error);
        return null; // Ensure that a null return is handled or change this to throw an error or return an error message
    }
}

function askQuestion(query:string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, (ans: unknown) => {
        rl.close();
        resolve(ans);
    }));
}


async function main() {
    try {
        // Set the STAGE environment variable (ensure this is set or passed into the script)
        const stage = process.env.STAGE;
        console.log(`stagename is: ${stage}`);
        if (!stage) {
            throw new Error('STAGE environment variable is not set!');
        }

        runCommand(`npm run build`, process.cwd(), {});

        console.log('Starting CDK deployment...');
        const runBackendStack = await askQuestion(`Do you want to run ${stage}LkcylStack? (y/n) `);
        
        runBackendStack === 'y' && runCommand(`npx cdk deploy ${stage}LkcylStack`, process.cwd(), { STAGE: stage });

        
        const buildFrontend = await askQuestion(`Do you want to install and build front end app, this can be your oppertunity to update aws-exports? (y/n) `);
        // Change to the frontend directory and build the React app
        buildFrontend === 'y' && runCommand('npm i', path.join(process.cwd(), 'frontend'), {}) && runCommand('npm run build', path.join(process.cwd(), 'frontend'), {});
    
        const runFrontEndTask = await askQuestion(`Do you want to run ${stage}FrontEndStack? (y/n) `);
        runFrontEndTask === 'y' && runCommand(`npx cdk deploy ${stage}FrontEndStack`, process.cwd(), { STAGE: stage });
    
    } catch (error) {
        console.error('Failed to build or deploy:', error);
        process.exit(1);
    }
}

main();
