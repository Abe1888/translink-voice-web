import dotenv from 'dotenv';
import { voiceReadinessService } from '../server/services/VoiceReadinessService';

dotenv.config();

const report = voiceReadinessService.getReport();

console.log(`Voice readiness: ${report.status.toUpperCase()}`);
console.log(`Generated: ${report.generatedAt}`);
console.log('');

for (const check of report.checks) {
  const marker = check.status.toUpperCase().padEnd(5, ' ');
  console.log(`[${marker}] ${check.name}: ${check.message}`);
  if (check.details && process.argv.includes('--detail')) {
    console.log(JSON.stringify(check.details, null, 2));
  }
}

console.log('');
console.log('Runtime summary:');
console.log(JSON.stringify(report.runtime, null, 2));

if (report.status === 'error') {
  process.exitCode = 1;
}
