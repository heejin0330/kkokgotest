const fs = require('fs');
const path = require('path');

// EUC-KR to UTF-8 변환 스크립트
// iconv-lite 없이 수동으로 변환 시도

const ncsFile = path.join('app', 'data', 'ncs.csv');
const outputFile = path.join('app', 'data', 'ncs_utf8.csv');

console.log('='.repeat(50));
console.log('NCS 파일 인코딩 변환 스크립트');
console.log('='.repeat(50));

// iconv-lite 로드 시도
let iconv;
try {
  iconv = require('iconv-lite');
  console.log('✓ iconv-lite 로드 성공');
} catch (e) {
  console.log('✗ iconv-lite가 설치되어 있지 않습니다.');
  console.log('  설치 명령어: pnpm add iconv-lite');
  process.exit(1);
}

// 파일 읽기
console.log(`\n원본 파일: ${ncsFile}`);
const buffer = fs.readFileSync(ncsFile);
console.log(`파일 크기: ${buffer.length} bytes`);

// EUC-KR로 디코딩
console.log('\nEUC-KR로 디코딩 중...');
const content = iconv.decode(buffer, 'euc-kr');

// 첫 줄 확인
const firstLine = content.split('\n')[0];
console.log(`첫 줄: ${firstLine.substring(0, 100)}...`);

// 한글 확인
if (firstLine.match(/[가-힣]/)) {
  console.log('✓ 한글 디코딩 성공!');
} else {
  console.log('✗ 한글 디코딩 실패');
  process.exit(1);
}

// UTF-8로 저장 (BOM 포함)
console.log(`\nUTF-8로 저장: ${outputFile}`);
fs.writeFileSync(outputFile, '\ufeff' + content, 'utf-8');
console.log('✓ 저장 완료!');

// 원본 파일 백업 및 교체
const backupFile = path.join('app', 'data', 'ncs_euckr_backup.csv');
console.log(`\n원본 파일 백업: ${backupFile}`);
fs.copyFileSync(ncsFile, backupFile);
console.log('✓ 백업 완료!');

console.log(`\n원본 파일 교체: ${ncsFile}`);
fs.copyFileSync(outputFile, ncsFile);
console.log('✓ 교체 완료!');

// 임시 파일 삭제
fs.unlinkSync(outputFile);
console.log('✓ 임시 파일 삭제 완료!');

console.log('\n' + '='.repeat(50));
console.log('NCS 파일 인코딩 변환 완료!');
console.log('='.repeat(50));
