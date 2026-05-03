import type { BusinessInfo } from "@/constants/business";

interface Props {
  business: BusinessInfo;
}

export function PrivacyKo({ business }: Props) {
  return (
    <>
      <section>
        <p>
          {business.legalNameKo}(이하 &ldquo;회사&rdquo;)은 「개인정보 보호법」
          및 관련 법령이 정한 바를 준수하여, 정보주체의 개인정보를 보호하고 이와
          관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같은
          처리방침을 두고 있습니다. 회사는 개인정보처리방침을 개정하는 경우
          웹사이트 공지사항을 통하여 공지합니다.
        </p>
      </section>

      <section id="purposes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제1조 개인정보의 처리목적
        </h2>
        <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            회원 가입 및 관리: 회원제 서비스 제공에 따른 본인 확인, 개인 식별,
            부정이용 방지, 가입 의사 확인, 만 14세 이상 확인
          </li>
          <li>
            서비스 제공: 콘텐츠 제공, 맞춤 서비스 제공, 결제·요금정산, 구매·요금
            결제, 본인 인증
          </li>
          <li>
            고충처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한
            연락·통지, 처리결과 통보
          </li>
          <li>
            마케팅 및 광고 활용 (별도 동의를 받은 경우에 한함): 신규 서비스
            개발, 이벤트 정보 및 참여기회 제공, 인구통계학적 특성에 따른 서비스
            제공 및 광고 게재
          </li>
        </ul>
      </section>

      <section id="items">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제2조 처리하는 개인정보의 항목
        </h2>
        <p>회사는 다음의 개인정보 항목을 처리합니다.</p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            <strong>회원가입 시 (필수):</strong> 이메일 주소, 비밀번호(암호화
            저장), 이름, 사용자명, 만 14세 이상 여부
          </li>
          <li>
            <strong>회원가입 시 (선택):</strong> 프로필 사진, 자기소개, 위치,
            외부 링크
          </li>
          <li>
            <strong>소셜 로그인:</strong> Google 또는 Naver로부터 제공받은
            이메일, 이름, 프로필 이미지
          </li>
          <li>
            <strong>유료 서비스 이용 시:</strong> 결제정보(카드사명·결제 수단
            식별값 등 결제대행사가 제공하는 비식별 토큰), 결제 기록·환불 기록
          </li>
          <li>
            <strong>자동 수집 항목:</strong> 접속 IP, 쿠키(인증용), User Agent,
            접속 로그, 서비스 이용 기록
          </li>
        </ul>
        <p className="mt-[.75em]">
          회사는 결제카드 번호·CVC·계좌번호 등 민감한 결제 정보를 직접 저장하지
          않으며, 결제대행사(PG)에서 발급한 비식별 토큰만을 보관합니다.
        </p>
      </section>

      <section id="retention">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제3조 개인정보의 처리 및 보유기간
        </h2>
        <p>
          회사는 정보주체로부터 개인정보를 수집할 때 동의받은 보유·이용 기간
          또는 법령에 따른 보유·이용 기간 내에서 개인정보를 처리·보유합니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>회원정보: 회원 탈퇴 시까지 (탈퇴 후 90일 이내 파기)</li>
          <li>
            「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 보유:
            <ul className="mt-[.4em] list-disc pl-[1.5em]">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
            </ul>
          </li>
          <li>「통신비밀보호법」에 따른 통신사실확인자료(접속 로그): 3개월</li>
          <li>마케팅 활용 동의 정보: 동의 철회 시 또는 회원 탈퇴 시까지</li>
        </ul>
      </section>

      <section id="third-parties">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제4조 개인정보의 제3자 제공
        </h2>
        <p>
          회사는 정보주체의 개인정보를 제1조의 처리목적 범위 내에서만 처리하며,
          정보주체의 동의·법률의 특별한 규정 등 「개인정보 보호법」 제17조에
          해당하는 경우에만 제3자에게 제공합니다. 현재 회사는 정보주체의
          개인정보를 제3자에게 제공하지 않습니다.
        </p>
      </section>

      <section id="entrustment">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제5조 개인정보 처리의 위탁
        </h2>
        <p>
          회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
          처리업무를 위탁하고 있습니다.
        </p>
        <div className="mt-[.75em] overflow-x-auto">
          <table className="w-full border-collapse text-[.9em]">
            <thead>
              <tr className="border-b border-foreground/20">
                <th className="py-[.5em] pr-[1em] text-left">수탁자</th>
                <th className="py-[.5em] pr-[1em] text-left">위탁업무 내용</th>
                <th className="py-[.5em] text-left">보유·이용기간</th>
              </tr>
            </thead>
            <tbody className="opacity-80">
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">Google LLC</td>
                <td className="py-[.5em] pr-[1em]">소셜 로그인 인증</td>
                <td className="py-[.5em]">회원 탈퇴 시까지</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">NAVER Corp.</td>
                <td className="py-[.5em] pr-[1em]">소셜 로그인 인증</td>
                <td className="py-[.5em]">회원 탈퇴 시까지</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">Brevo (Sendinblue SAS)</td>
                <td className="py-[.5em] pr-[1em]">이메일 발송 (인증·알림)</td>
                <td className="py-[.5em]">위탁계약 종료 시까지</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">㈜아이티이지 (ITEasy)</td>
                <td className="py-[.5em] pr-[1em]">서버 호스팅·DB 운영</td>
                <td className="py-[.5em]">위탁계약 종료 시까지</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">㈜코리아포트원 (PortOne)</td>
                <td className="py-[.5em] pr-[1em]">결제대행 통합 연동</td>
                <td className="py-[.5em]">관계법령에 따름</td>
              </tr>
              <tr>
                <td className="py-[.5em] pr-[1em]">토스페이먼츠㈜</td>
                <td className="py-[.5em] pr-[1em]">결제대행</td>
                <td className="py-[.5em]">관계법령에 따름</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-[.75em] text-[.9em] opacity-70">
          Google·Brevo 등 일부 수탁자는 국외에 소재하고 있으며, 회사는 개인정보
          처리를 위탁할 때 「개인정보 보호법」 제26조에 따라 필요한 사항을
          계약서 등에 명시하고 있습니다.
        </p>
      </section>

      <section id="rights">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제6조 정보주체의 권리·의무 및 행사방법
        </h2>
        <p>
          정보주체는 회사에 대하여 언제든지 다음 각 호의 권리를 행사할 수
          있습니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구 (단, 다른 법령에 따라 보존이 필요한 경우 제외)</li>
          <li>처리정지 요구</li>
        </ul>
        <p className="mt-[.75em]">
          권리 행사는 회사에 대해 「개인정보 보호법」 시행령 제41조 제1항에 따라
          서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에
          대해 지체 없이 조치하겠습니다. 회원은 &ldquo;계정 설정&rdquo; 메뉴에서
          직접 본인의 정보를 열람·수정·삭제할 수 있습니다.
        </p>
      </section>

      <section id="destruction">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제7조 개인정보의 파기
        </h2>
        <p>
          회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
          불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>전자적 파일: 복구·재생되지 않는 방법으로 영구 삭제</li>
          <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
        </ul>
      </section>

      <section id="security">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제8조 개인정보의 안전성 확보조치
        </h2>
        <p>
          회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
          있습니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
          <li>
            기술적 조치: 비밀번호 일방향 암호화 저장, 세션 토큰 HTTP-only 쿠키
            보관, HTTPS(TLS) 전 구간 적용, 선택적 2단계 인증, 접근권한 관리
          </li>
          <li>물리적 조치: 데이터센터 출입통제</li>
        </ul>
      </section>

      <section id="cookies">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제9조 개인정보 자동수집장치의 설치·운영 및 거부
        </h2>
        <p>
          회사는 서비스 인증을 위해 HTTP-only 세션 쿠키를 사용합니다. 해당
          쿠키는 서비스 제공에 반드시 필요하므로 거부 시 일부 서비스 이용이
          제한될 수 있습니다. 회사는 광고·추적용 쿠키를 사용하지 않습니다.
        </p>
      </section>

      <section id="officer">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제10조 개인정보보호책임자
        </h2>
        <p>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
          관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이
          개인정보보호책임자를 지정하고 있습니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>성명: {business.privacyOfficerName}</li>
          <li>연락처: {business.privacyOfficerEmail}</li>
        </ul>
      </section>

      <section id="remedies">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제11조 권익침해 구제방법
        </h2>
        <p>
          정보주체는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에
          분쟁해결이나 상담 등을 신청할 수 있습니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            개인정보분쟁조정위원회: (국번없이) 1833-6972 / www.kopico.go.kr
          </li>
          <li>개인정보침해신고센터: (국번없이) 118 / privacy.kisa.or.kr</li>
          <li>대검찰청 사이버범죄수사단: 02-3480-3573 / www.spo.go.kr</li>
          <li>경찰청 사이버안전국: 182 / cyberbureau.police.go.kr</li>
        </ul>
      </section>

      <section id="changes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제12조 개인정보처리방침의 변경
        </h2>
        <p>
          이 개인정보처리방침은 시행일부터 적용되며, 법령 및 방침에 따른
          변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일
          전부터 공지사항을 통하여 고지할 것입니다.
        </p>
      </section>

      <section id="business">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제13조 사업자 정보
        </h2>
        <p>
          <strong>{business.legalNameKo}</strong>
          <br />
          대표자: {business.representativeKo}
          <br />
          사업자등록번호: {business.registrationNumber}
          <br />
          통신판매업신고: {business.mailOrderRegistrationNumber}
          <br />
          주소: {business.addressKo}
          <br />
          이메일: {business.email}
        </p>
      </section>
    </>
  );
}
