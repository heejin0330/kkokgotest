# 데이터 병합 스크립트

이 스크립트는 학교 정보(`highschoolinfo.csv`)와 학과 정보(`all_major_info_merged.csv`)를 병합하여 마스터 데이터베이스(`kkokgo_master_db.csv`)를 생성합니다.

## 사용 방법 (권장: Node.js)

프로젝트 루트 디렉토리(`kkokgo_landing`)에서 실행:

```bash
pnpm run merge-data
```

또는 직접 실행:

```bash
node scripts/merge_school_data.js
```

**장점**: Python 설치가 필요 없고, Next.js 프로젝트와 동일한 환경을 사용합니다.

## 사용 방법 (대안: Python)

Python이 설치되어 있는 경우:

```bash
python scripts/merge_school_data.py
```

### Python 사전 요구사항

- Python 3.7 이상
- pandas 라이브러리

### Python 설치 방법

1. Python 가상환경 생성 (선택사항, 권장):
```bash
python -m venv venv
```

2. 가상환경 활성화:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. 필요한 패키지 설치:
```bash
pip install -r requirements.txt
```

또는 직접 설치:
```bash
pip install pandas
```

## 출력

스크립트 실행 후 다음 파일이 생성됩니다:
- `app/data/kkokgo_master_db.csv`

이 파일은 두 CSV 파일을 `행정표준코드`와 `시도교육청코드`를 기준으로 병합한 결과입니다.

## 데이터 구조

병합된 데이터는 다음 정보를 포함합니다:

### 학과 정보 (all_major_info_merged.csv에서)
- 시도교육청코드
- 시도교육청명
- 행정표준코드
- 학교명
- 주야과정명
- 계열명
- 학과명
- 수정일자

### 학교 상세 정보 (highschoolinfo.csv에서)
- 영문학교명
- 학교종류명
- 시도명
- 관할조직명
- 설립명
- 도로명주소
- 전화번호
- 홈페이지주소
- 고등학교구분명
- 고등학교일반전문구분명
- 기타 학교 상세 정보

## Next.js 앱에서 사용하기

병합된 데이터를 Next.js 앱에서 사용하려면 `lib/data-loader.ts`의 함수를 사용하세요:

```typescript
import { loadSchoolMajorData, findSchoolByName, filterSpecializedSchools } from '@/lib/data-loader';

// 서버 컴포넌트나 API 라우트에서
const data = await loadSchoolMajorData();

// 특정 학교 검색
const schools = findSchoolByName(data, '가락고등학교');

// 특성화고/마이스터고만 필터링
const specialized = filterSpecializedSchools(data);
```

## 주의사항

- 스크립트는 프로젝트 루트 디렉토리에서 실행해야 합니다
- 입력 파일(`highschoolinfo.csv`, `all_major_info_merged.csv`)이 `app/data/` 폴더에 있어야 합니다
- 출력 파일은 기존 파일을 덮어씁니다

## 문제 해결

### 파일을 찾을 수 없다는 오류
- `app/data/` 폴더에 필요한 CSV 파일이 있는지 확인하세요
- 프로젝트 루트 디렉토리에서 스크립트를 실행하고 있는지 확인하세요

### pandas 모듈을 찾을 수 없다는 오류 (Python 사용 시)
- `pip install pandas` 명령어로 pandas를 설치하세요
- 가상환경을 사용하는 경우 활성화되어 있는지 확인하세요
- Python이 설치되지 않은 경우, Node.js 스크립트를 사용하세요: `pnpm run merge-data`
