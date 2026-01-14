import os
import sys

# pandas import 확인
try:
    import pandas as pd
except ImportError:
    print("=" * 50)
    print("오류: pandas가 설치되지 않았습니다!")
    print("=" * 50)
    print("다음 명령어로 pandas를 설치해주세요:")
    print("  pip install pandas")
    print("또는")
    print("  pip install -r requirements.txt")
    sys.exit(1)

# 1. 경로 설정
data_dir = os.path.join('app', 'data')
school_file = os.path.join(data_dir, 'highschoolinfo.csv')
major_file = os.path.join(data_dir, 'all_major_info_merged.csv')
output_file = os.path.join(data_dir, 'kkokgo_master_db.csv')

# 스크립트 시작 확인
print("=" * 50)
print("데이터 병합 스크립트 시작")
print("=" * 50)
print(f"현재 작업 디렉토리: {os.getcwd()}")
print(f"Python 버전: {sys.version}")
print(f"pandas 버전: {pd.__version__}")
print("=" * 50)

# 2. 파일 존재 확인
if not os.path.exists(school_file):
    print(f"오류: 학교 정보 파일을 찾을 수 없습니다: {school_file}")
    sys.exit(1)

if not os.path.exists(major_file):
    print(f"오류: 학과 정보 파일을 찾을 수 없습니다: {major_file}")
    sys.exit(1)

print(f"✓ 학교 정보 파일: {school_file}")
print(f"✓ 학과 정보 파일: {major_file}")

# 3. 파일 로드
try:
    print("\n파일 로드 중...")
    df_school = pd.read_csv(school_file, encoding='utf-8-sig')
    df_major = pd.read_csv(major_file, encoding='utf-8-sig')
    print(f"✓ 학교 정보: {len(df_school)}개 행")
    print(f"✓ 학과 정보: {len(df_major)}개 행")
except Exception as e:
    print(f"오류: 파일 로드 실패")
    print(f"상세 오류: {e}")
    sys.exit(1)

# 4. 데이터 전처리
print("\n데이터 전처리 중...")

# 행정표준코드가 공백이거나 NaN인 행 제거
df_major = df_major[df_major['행정표준코드'].notna()]
df_major = df_major[df_major['행정표준코드'].astype(str).str.strip() != '']
df_school = df_school[df_school['행정표준코드'].notna()]
df_school = df_school[df_school['행정표준코드'].astype(str).str.strip() != '']

print(f"✓ 전처리 후 학과 정보: {len(df_major)}개 행")
print(f"✓ 전처리 후 학교 정보: {len(df_school)}개 행")

# 5. 데이터 타입 통일 (매칭 정확도 확보)
df_school['행정표준코드'] = df_school['행정표준코드'].astype(str).str.strip()
df_major['행정표준코드'] = df_major['행정표준코드'].astype(str).str.strip()
df_school['시도교육청코드'] = df_school['시도교육청코드'].astype(str).str.strip()
df_major['시도교육청코드'] = df_major['시도교육청코드'].astype(str).str.strip()

# 6. 병합 전 데이터 확인
print("\n병합 전 데이터 확인...")
print(f"학과 데이터의 행정표준코드 샘플: {df_major['행정표준코드'].head(5).tolist()}")
print(f"학교 데이터의 행정표준코드 샘플: {df_school['행정표준코드'].head(5).tolist()}")

# 7. 병합 실행
print("\n데이터 병합 중...")
try:
    merged_df = pd.merge(
        df_major, 
        df_school, 
        on=['행정표준코드', '시도교육청코드'], 
        how='inner', 
        suffixes=('', '_school')
    )
    
    if len(merged_df) == 0:
        print("경고: 병합 결과가 비어있습니다!")
        print("행정표준코드와 시도교육청코드가 일치하는 데이터가 없습니다.")
        print("\n디버깅 정보:")
        print(f"- 학과 데이터의 고유한 행정표준코드 개수: {df_major['행정표준코드'].nunique()}")
        print(f"- 학교 데이터의 고유한 행정표준코드 개수: {df_school['행정표준코드'].nunique()}")
        print(f"- 공통 행정표준코드 개수: {len(set(df_major['행정표준코드']) & set(df_school['행정표준코드']))}")
        sys.exit(1)
    
    print(f"✓ 병합 완료: {len(merged_df)}개 행")
    
except Exception as e:
    print(f"오류: 데이터 병합 실패")
    print(f"상세 오류: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 8. 결과 저장
print(f"\n결과 저장 중: {output_file}")
try:
    merged_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print("✓ 저장 완료!")
except Exception as e:
    print(f"오류: 파일 저장 실패")
    print(f"상세 오류: {e}")
    sys.exit(1)

# 9. 결과 요약
print("\n" + "=" * 50)
print("작업 결과")
print("=" * 50)
print(f"생성 파일: {output_file}")
print(f"전체 행 개수: {len(merged_df):,}개")
print(f"컬럼 개수: {len(merged_df.columns)}개")
print(f"\n컬럼 목록:")
for i, col in enumerate(merged_df.columns, 1):
    print(f"  {i}. {col}")
print("=" * 50)
