import { NextResponse } from "next/server";
import coolsms from "coolsms-node-sdk";

// 쿨에스엠에스 클라이언트 초기화
const messageService = new coolsms(
  process.env.COOLSMS_API_KEY!,
  process.env.COOLSMS_API_SECRET!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // resultUrl은 이제 안 받습니다. 서버에서 직접 만듭니다.
    const { phone, resultType, resultTitle } = body;

    if (!phone || !resultTitle) {
      return NextResponse.json(
        { success: false, error: "필수 정보 누락" },
        { status: 400 }
      );
    }

    // 전화번호 하이픈 제거
    const cleanPhone = phone.replace(/-/g, "");

    // ▼▼▼ [핵심 수정] 무조건 이 짧은 주소로 만듭니다 ▼▼▼
    // 대표님의 실제 배포 도메인을 여기에 적어주세요. (마지막 / 빼고)
    const BASE_URL = "https://kkokgotest.vercel.app";

    // 전화번호별 개인화된 링크 생성 (타입 꼬리표 붙이기)
    const shortLink = `${BASE_URL}/?type=${resultType}`;

    // 보낼 메시지 내용 구성 (LMS: 장문 문자)
    const messageText = `[꼭고] 진로 분석 리포트 📩

당신의 진로 유형:
"${resultTitle}"

상위 1% 마이스터고 추천 정보와
숨겨진 합격 전략을 확인하세요.

👇 리포트 확인하기
${shortLink}

*무료 진단 요청에 의해 발송되었습니다.`;

    // 실제 발송 요청
    const response = await messageService.sendOne({
      to: cleanPhone,
      from: process.env.COOLSMS_SENDER_PHONE!, // 발신번호 (사전 등록 필수)
      text: messageText,
      autoTypeDetect: true, // 메시지 길이에 따라 SMS/LMS 자동 감지
    });

    console.log("문자 발송 성공:", response);
    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("문자 발송 실패:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
