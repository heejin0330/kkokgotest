import React from 'react';
import schoolsData from '@/src/data/schools.json';
import NCSBadge from './NCSBadge';

interface School {
  school_name: string;
  address: string;
  type?: string;
  ncs_code?: string;
  ncs_name?: string;
  homepage?: string;
}

export default function SchoolList() {
  const schools = schoolsData as School[];

  return (
    <div className="p-4 w-full max-w-7xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
           🏫 전국 직업계고 찾아보기
        </h2>
        <p className="text-gray-500 mt-2">
          총 <span className="text-blue-600 font-bold">{schools.length}</span>개의 학교가 등록되어 있습니다.
        </p>
      </div>

      {/* 학교 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school, index) => (
          <div 
            key={index} 
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                 {/* 학교 유형 배지 */}
                <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">
                  {school.type || "직업계고"}
                </span>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>

              {/* 학교 이름 */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {school.school_name}
              </h3>
              
              {/* 주소 */}
              <p className="text-gray-500 text-sm mb-4 truncate">
                📍 {school.address}
              </p>

              {/* 🔥 NCS 배지 (여기가 핵심!) */}
              <div className="mt-2 pt-3 border-t border-gray-100">
                {school.ncs_code ? (
                  <NCSBadge 
                      ncsCode={school.ncs_code} 
                      ncsName={school.ncs_name || ''} 
                  />
                ) : (
                   <span className="text-xs text-gray-400">NCS 정보 없음</span>
                )}
              </div>
            </div>

            {/* 홈페이지 버튼 */}
            {school.homepage && (
              <a 
                href={school.homepage.startsWith('http') ? school.homepage : `http://${school.homepage}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-5 w-full block text-center py-2.5 rounded-lg bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100 transition-colors"
              >
                학교 홈페이지 이동 →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}








