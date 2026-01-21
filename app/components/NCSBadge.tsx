import React from 'react';

// 공식 NCS 대분류 코드에 맞춘 색상 매핑
// 디자이너가 없어도 깔끔해 보이도록 Tailwind CSS 기본 팔레트 활용
const ncsColors: Record<string, string> = {
  '20': 'bg-blue-100 text-blue-800 border-blue-200',        // 정보통신 (신뢰의 파랑)
  '08': 'bg-purple-100 text-purple-800 border-purple-200',  // 디자인 (창의적인 보라)
  '06': 'bg-green-100 text-green-800 border-green-200',     // 보건 (치유의 초록)
  '15': 'bg-slate-100 text-slate-800 border-slate-200',     // 기계 (단단한 메탈색)
  '13': 'bg-orange-100 text-orange-800 border-orange-200',  // 조리 (식욕을 돋우는 주황)
  '02': 'bg-indigo-100 text-indigo-800 border-indigo-200',  // 경영 (지적인 인디고)
  '18': 'bg-pink-100 text-pink-800 border-pink-200',        // 패션 (세련된 핑크)
  '19': 'bg-yellow-100 text-yellow-800 border-yellow-200',  // 전기 (에너지의 노랑)
  '00': 'bg-gray-100 text-gray-600 border-gray-200',        // 기타
};

interface NCSBadgeProps {
  ncsCode: string;
  ncsName: string;
}

export default function NCSBadge({ ncsCode, ncsName }: NCSBadgeProps) {
  // 코드가 매핑되지 않았을 경우 안전하게 '00' 처리
  const colorClass = ncsColors[ncsCode] || ncsColors['00'];

  return (
    <div className="inline-flex flex-col items-start gap-0.5 mt-2">
      {/* 상단: '교육부 NCS 기준' 인증 라벨 (신뢰도 상승용) */}
      <div className="flex items-center gap-1 opacity-80">
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-600">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-bold text-gray-500 tracking-tighter uppercase">
            교육부 NCS 기준
        </span>
      </div>

      {/* 하단: 실제 분류명 배지 */}
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colorClass}`}>
        {ncsName}
      </span>
    </div>
  );
}








