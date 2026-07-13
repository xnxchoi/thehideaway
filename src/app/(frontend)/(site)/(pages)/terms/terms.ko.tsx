import { Link } from "@/components/core/Link/Link";
import type { BusinessInfo } from "@/constants/business";

interface Props {
  business: BusinessInfo;
}

export function TermsKo({ business }: Props) {
  return (
    <>
      <section id="purpose">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">제1조 목적</h2>
        <p>
          이 약관은 {business.legalNameKo}(이하 &ldquo;회사&rdquo;)이 운영하는
          웹사이트 {business.domain}(이하 &ldquo;서비스&rdquo;)의 이용과
          관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로
          합니다.
        </p>
      </section>

      <section id="definitions">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">제2조 정의</h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            &ldquo;서비스&rdquo;: 회사가 제공하는 모든 콘텐츠 및 부수 서비스를
            의미합니다.
          </li>
          <li>
            &ldquo;이용자&rdquo;: 본 약관에 따라 회사가 제공하는 서비스를
            이용하는 회원 및 비회원을 말합니다.
          </li>
          <li>
            &ldquo;회원&rdquo;: 회사에 개인정보를 제공하여 회원등록을 한 자로서,
            회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를
            말합니다.
          </li>
          <li>
            &ldquo;유료서비스&rdquo;: 회사가 회원에게 유상으로 제공하는
            서비스(멤버십, 티켓 등)를 말합니다.
          </li>
        </ul>
      </section>

      <section id="amendment">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제3조 약관의 게시·개정
        </h2>
        <p>
          회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에
          게시합니다. 회사는 「약관의 규제에 관한 법률」, 「전자상거래 등에서의
          소비자보호에 관한 법률」 등 관련 법령에 위배하지 않는 범위에서 이
          약관을 개정할 수 있습니다. 약관이 개정되는 경우 회사는 적용일자와
          개정내용을 명시하여 시행 7일 전부터 공지하며, 이용자에게 불리한 개정의
          경우 30일 전부터 공지합니다.
        </p>
      </section>

      <section id="formation">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제4조 이용계약의 성립
        </h2>
        <p>
          이용계약은 이용자가 본 약관에 동의한 후 회원가입을 신청하고 회사가
          이를 승낙함으로써 성립합니다. 회원은 만 14세 이상이어야 합니다.
        </p>
      </section>

      <section id="obligations">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제5조 회원의 의무
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>회원은 본 약관 및 관계법령을 준수하여야 합니다.</li>
          <li>타인의 정보를 도용하거나 타인 명의로 가입하여서는 안됩니다.</li>
          <li>
            회사의 사전 서면 동의 없이 서비스를 영리목적으로 이용할 수 없습니다.
          </li>
          <li>
            서비스의 안정적 운영을 방해하는 일체의 행위를 하여서는 안됩니다.
          </li>
          <li>
            다른 이용자의 개인정보를 동의 없이 수집·이용·공개하여서는 안됩니다.
          </li>
        </ul>
      </section>

      <section id="content">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">제6조 콘텐츠</h2>
        <p>
          회원이 서비스에 게시한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다.
          다만 회원은 회사가 서비스의 운영, 전시, 배포, 홍보의 목적으로 해당
          콘텐츠를 별도의 허락 없이 비독점적으로 사용할 수 있는 권리를 회사에
          부여합니다.
        </p>
        <p className="mt-[.75em]">
          회사는 본 약관 또는 관계 법령에 위반되거나 부적절하다고 판단되는
          콘텐츠를 사전 통지 없이 삭제할 수 있습니다.
        </p>
      </section>

      <section id="payment">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제7조 유료서비스 이용계약의 성립 및 결제
        </h2>
        <p>
          유료서비스 이용계약은 회원이 신청 내용을 확인한 후 결제를 완료하고
          회사가 그 신청을 승낙함으로써 성립합니다. 결제대행은
          {` ${business.legalNameKo}`}이 지정한 결제대행업체(이하
          &ldquo;PG사&rdquo;)를 통하여 이루어집니다.
        </p>
        <p className="mt-[.75em]">
          회사는 결제 카드 정보·계좌번호 등 민감한 결제 정보를 직접 저장하지
          않으며, PG사가 발급하는 비식별 토큰만을 보관합니다.
        </p>
      </section>

      <section id="withdrawal">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제8조 청약철회 및 환불
        </h2>
        <p>
          「전자상거래 등에서의 소비자보호에 관한 법률」에 따라, 회원은 다음과
          같이 청약을 철회할 수 있습니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            <strong>일반 유료서비스 (멤버십 등):</strong> 결제일로부터 7일 이내.
            단, 디지털 콘텐츠의 경우 회원이 콘텐츠 제공이 개시된 부분에 대해서는
            청약철회가 제한될 수 있습니다.
          </li>
          <li>
            <strong>이벤트 티켓:</strong> 행사일로부터 일정 기간 전까지
            청약철회가 가능하며, 구체적인 환불 기준은 각 이벤트 안내 페이지 및
            별도의{" "}
            <Link href="/refund" className="underline">
              취소·환불 정책
            </Link>
            에 따릅니다.
          </li>
          <li>
            청약철회 의사표시는 서면, 이메일, 또는 회사가 제공하는 환불 신청
            기능을 통하여 할 수 있습니다.
          </li>
        </ul>
        <p className="mt-[.75em]">
          환불은 청약철회 접수일로부터 영업일 기준 3일 이내에 동일한 결제
          수단으로 처리되며, 가상계좌 결제의 경우 환불받을 계좌정보를 제공해주신
          후 처리됩니다.
        </p>
      </section>

      <section id="termination">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제9조 회원의 탈퇴 및 자격상실
        </h2>
        <p>
          회원은 언제든지 계정 설정 메뉴에서 직접 탈퇴할 수 있습니다. 회사는
          회원이 본 약관 또는 관계 법령을 위반한 경우 사전 통지 후 회원 자격을
          제한·정지·상실시킬 수 있습니다.
        </p>
      </section>

      <section id="service">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제10조 서비스의 제공 및 변경
        </h2>
        <p>
          회사는 운영상·기술상의 필요에 따라 서비스의 일부 또는 전부를 변경할 수
          있으며, 변경된 내용 및 제공일자는 사전에 공지합니다. 다만, 회사는 다음
          각 호에 해당하는 경우 서비스의 제공을 일시 중단할 수 있습니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>설비의 보수 등 공사로 인해 부득이한 경우</li>
          <li>국가비상사태, 정전, 천재지변 등의 불가항력적 사유</li>
          <li>기간통신사업자가 전기통신서비스를 중지한 경우</li>
        </ul>
      </section>

      <section id="liability">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제11조 면책 및 책임의 제한
        </h2>
        <p>
          회사는 천재지변, 전쟁, 회원의 귀책사유 등 회사의 합리적 통제 범위를
          벗어난 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다. 회사가
          본 약관 위반에 대하여 책임을 지는 경우, 그 책임 범위는 해당 회원이
          직전 12개월간 회사에 지급한 금액을 한도로 합니다. 단, 회사의 고의 또는
          중대한 과실로 인한 손해의 경우에는 그러하지 아니합니다.
        </p>
      </section>

      <section id="disputes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제12조 분쟁해결 및 관할법원
        </h2>
        <p>
          회사와 회원 간 발생한 분쟁에 관하여는 대한민국 법을 적용합니다. 분쟁
          해결을 위한 소송은 「민사소송법」상의 관할법원에 제기합니다. 회사는
          「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항에 따라
          분쟁발생시 한국소비자원 또는 공정거래위원회에 분쟁조정을 신청할 수
          있음을 안내드립니다.
        </p>
      </section>

      <section id="business">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제13조 사업자 정보 및 연락처
        </h2>
        <p>
          <strong>{business.legalNameKo}</strong>
          <br />
          대표자: {business.representativeKo}
          <br />
          사업자등록번호: {business.registrationNumber}
          <br />
          주소: {business.addressKo}
          <br />
          이메일: {business.email}
        </p>
      </section>
    </>
  );
}
