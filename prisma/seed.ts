import 'dotenv/config';
import { PrismaClient, AdmissionType, TraitType } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertTraits() {
  const traits = [
    { name: '수리력', type: TraitType.APTITUDE },
    { name: '공간지각력', type: TraitType.APTITUDE },
    { name: '언어이해', type: TraitType.APTITUDE },
    { name: '문제해결', type: TraitType.APTITUDE },
    { name: '기계조작', type: TraitType.INTEREST },
    { name: '현장적응', type: TraitType.INTEREST },
  ];

  for (const trait of traits) {
    await prisma.trait.upsert({
      where: {
        name_type: {
          name: trait.name,
          type: trait.type,
        },
      },
      update: {},
      create: trait,
    });
  }
}

async function updateSudoSchoolData() {
  const school = await prisma.school.findFirst({
    where: { name: { contains: '수도전기' } },
    include: { departments: true },
  });

  if (!school) {
    console.log('⚠️ 수도전기공업고등학교를 찾지 못했습니다.');
    return;
  }

  console.log(`✅ ${school.name} 학과 ${school.departments.length}개 업데이트 시작`);

  const year = new Date().getFullYear();

  for (const dept of school.departments) {
    // 기존 전형 삭제 후 재생성
    await prisma.admissionRule.deleteMany({
      where: { departmentId: dept.id },
    });

    await prisma.admissionRule.createMany({
      data: [
        {
          departmentId: dept.id,
          admissionType: AdmissionType.GENERAL,
          year,
          gpaRatio: 30,
          interviewRatio: 30,
          aptitudeRatio: 30,
          attendanceRatio: 10,
          writtenRatio: null,
          description: '내신과 적성검사 중심 (PDF 분석 기반)',
        },
        {
          departmentId: dept.id,
          admissionType: AdmissionType.SPECIAL,
          year,
          gpaRatio: 10,
          interviewRatio: 50,
          aptitudeRatio: 30,
          attendanceRatio: 10,
          writtenRatio: null,
          description: '면접 비중 높음 (PDF 분석 기반)',
        },
      ],
    });

    // 기존 목표기업 삭제 후 재생성
    await prisma.targetCompany.deleteMany({
      where: { departmentId: dept.id },
    });

    if (dept.name.includes('전기') || dept.name.includes('에너지')) {
      await prisma.targetCompany.createMany({
        data: [
          { departmentId: dept.id, name: '한국전력공사', industryType: '공기업' },
          { departmentId: dept.id, name: '삼성전자', industryType: '대기업(반도체)' },
          { departmentId: dept.id, name: '한국수력원자력', industryType: '공기업' },
        ],
      });
    }
  }
}

async function main() {
  console.log('🔄 데이터 업데이트 시작');

  await upsertTraits();
  console.log('✅ Trait 데이터 확인/업데이트 완료');

  await updateSudoSchoolData();
  console.log('✨ 데이터 업데이트 완료');
}

main()
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

