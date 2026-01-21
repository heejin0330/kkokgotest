import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// 홀랜드 유형별 설정 (커스텀 후킹 문구)
const HOLLAND_TYPES: Record<string, {
  type: string;
  title: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  description: string;
  gradient: string;
}> = {
  R: {
    type: '현실형',
    title: '대체불가 엔지니어',
    emoji: '🔧',
    bgColor: '#1a365d',
    textColor: '#ffffff',
    description: "AI도 못 따라오는 '신의 손'. 기술이 곧 권력이다.",
    gradient: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #3182ce 100%)',
  },
  I: {
    type: '탐구형',
    title: '데이터 예언자',
    emoji: '🔬',
    bgColor: '#234e52',
    textColor: '#ffffff',
    description: '남들이 못 보는 1%의 비밀, 데이터로 다 찾아냄.',
    gradient: 'linear-gradient(135deg, #234e52 0%, #285e61 50%, #319795 100%)',
  },
  A: {
    type: '예술형',
    title: '천재 크리에이터',
    emoji: '🎨',
    bgColor: '#553c9a',
    textColor: '#ffffff',
    description: '숨만 쉬어도 아이디어가 돈이 되는 창작 천재',
    gradient: 'linear-gradient(135deg, #553c9a 0%, #6b46c1 50%, #805ad5 100%)',
  },
  S: {
    type: '사회형',
    title: '협상의 신(God)',
    emoji: '🤝',
    bgColor: '#744210',
    textColor: '#ffffff',
    description: '말로 천 냥 빚 갚는 능력자. 어딜 가나 핵인싸!',
    gradient: 'linear-gradient(135deg, #744210 0%, #975a16 50%, #d69e2e 100%)',
  },
  E: {
    type: '진취형',
    title: '미래의 유니콘 CEO',
    emoji: '👑',
    bgColor: '#742a2a',
    textColor: '#ffffff',
    description: '월급쟁이는 거절한다. 나는 내가 사장 할래!',
    gradient: 'linear-gradient(135deg, #742a2a 0%, #9b2c2c 50%, #e53e3e 100%)',
  },
  C: {
    type: '관습형',
    title: '20살 회계사 유망주',
    emoji: '📊',
    bgColor: '#1a202c',
    textColor: '#ffffff',
    description: '돈 계산 하나는 기가 막힘! 금융권 프리패스상',
    gradient: 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)',
  },
};

// 기본 OG 이미지 (유형 없을 때)
const DEFAULT_CONFIG = {
  type: '',
  title: '나의 적성 유형은?',
  emoji: '🎯',
  bgColor: '#667eea',
  textColor: '#ffffff',
  description: '1분 테스트로 나에게 맞는 특성화고 찾기',
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type')?.toUpperCase() || '';
  const format = searchParams.get('format') || 'og'; // 'og' (1200x630) or 'story' (1080x1920)
  
  const config = HOLLAND_TYPES[type] || DEFAULT_CONFIG;
  const isResult = !!HOLLAND_TYPES[type];
  const isStory = format === 'story';
  
  // 이미지 크기 설정
  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: config.gradient,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        />

        {/* 메인 콘텐츠 - 가로/세로형에 따라 동적 조정 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isStory ? '20px' : '5px',
            zIndex: 1,
            marginTop: isStory ? '0px' : '-70px',
          }}
        >
          {/* 이모지 */}
          <div
            style={{
              fontSize: isStory ? (isResult ? '150px' : '120px') : (isResult ? '80px' : '60px'),
              marginBottom: isStory ? '20px' : '0px',
            }}
          >
            {config.emoji}
          </div>

          {/* 결과 유형 또는 타이틀 */}
          {isResult ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isStory ? '20px' : '5px',
              }}
            >
              <div
                style={{
                  fontSize: isStory ? '36px' : '24px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                }}
              >
                나의 적성 유형
              </div>
              <div
                style={{
                  fontSize: isStory ? '72px' : '56px',
                  fontWeight: 'bold',
                  color: config.textColor,
                  textShadow: '2px 2px 10px rgba(0, 0, 0, 0.3)',
                  textAlign: 'center',
                  maxWidth: isStory ? '900px' : '700px',
                }}
              >
                {config.title}
              </div>
              <div
                style={{
                  fontSize: isStory ? '32px' : '22px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  maxWidth: isStory ? '850px' : '700px',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  marginTop: isStory ? '10px' : '0px',
                }}
              >
                {config.description}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isStory ? '30px' : '15px',
              }}
            >
              <div
                style={{
                  fontSize: isStory ? '72px' : '56px',
                  fontWeight: 'bold',
                  color: config.textColor,
                  textShadow: '2px 2px 10px rgba(0, 0, 0, 0.3)',
                  textAlign: 'center',
                }}
              >
                {config.title}
              </div>
              <div
                style={{
                  fontSize: isStory ? '36px' : '28px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                  maxWidth: isStory ? '850px' : '700px',
                }}
              >
                {config.description}
              </div>
            </div>
          )}
        </div>

        {/* 상단 로고/브랜드 */}
        <div
          style={{
            position: 'absolute',
            top: isStory ? '120px' : '100px',
            left: isStory ? '50%' : '80px',
            transform: isStory ? 'translateX(-50%)' : 'none',
            display: 'flex',
            flexDirection: isStory ? 'column' : 'row',
            alignItems: 'center',
            gap: isStory ? '10px' : '15px',
          }}
        >
          <div
            style={{
              fontSize: isStory ? '48px' : '36px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.95)',
              letterSpacing: '2px',
            }}
          >
            꼭고
          </div>
          <div
            style={{
              fontSize: isStory ? '24px' : '20px',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
            }}
          >
            AI 기반 특성화고·마이스터고 매칭
          </div>
        </div>

        {/* 하단 테스트 유도 문구 */}
        {isResult && (
          <div
            style={{
              position: 'absolute',
              bottom: isStory ? '200px' : '100px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: isStory ? '20px 50px' : '15px 30px',
              borderRadius: '50px',
            }}
          >
            <div
              style={{
                fontSize: isStory ? '36px' : '26px',
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 600,
              }}
            >
              👆 나도 테스트하기
            </div>
          </div>
        )}
        
        {/* 세로형 하단 스와이프 안내 */}
        {isStory && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              ↑ 스와이프하여 테스트 시작
            </div>
          </div>
        )}
      </div>
    ),
    {
      width,
      height,
    }
  );
}

