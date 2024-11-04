import {useRef} from 'react';
import Button from "@mui/material/Button";
import CommonResource from "../../util/CommonResource.jsx";

const Step4Component = ({ response }) => {
  const pdfRef = useRef();

  const handlePrint = () => {
      // 인쇄할 내용을 위한 새로운 HTML 생성
      const printContent = pdfRef.current.innerHTML;

      const printWindow = window.open('', '_blank');
      const printStyle = `
      <style>
        body {
          margin: 0;
          padding: 20px;
          background-color: white;
          color: black;
        }
        
         @media print {
        body {
          display: block;
        }
      }
      @media screen {
        body {
          display: none;
        }
      }
      </style>
    `;

      printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          ${printStyle}
        </head>
        <body>
          <div>${printContent}</div>
        </body>
      </html>
    `);
      printWindow.document.close();

      // 인쇄 대화상자 열기
      printWindow.print();

      // 인쇄 후 창 닫기
      printWindow.close();
  };

  const calculateHeight = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);
    const heightInPixels = div.offsetHeight; // 픽셀 단위 높이
    document.body.removeChild(div);

    // 픽셀을 mm로 변환
    const heightInMM = heightInPixels / 3.779; // 1mm ≈ 3.779px
    return heightInMM;
  };

  const renderContent = () => {
    const sections = [];
    let currentHeight = 0;
    // eslint-disable-next-line react/prop-types
    response.collection.map((item, index) => {
      const passageHeight = calculateHeight(item.passage.passageHtml);
      console.log("지문 길이 (mm)", passageHeight);

      // 지문이 추가 가능한지 체크
      // if (currentHeight + passageHeight > 270) {
      //   sections.push(<div key={`section-${index}`} style={{ marginBottom: '100mm' }} />);
      //   currentHeight = 0; // 높이 초기화
      // }

      // 지문 추가
      sections.push(
          <div key={`passage-${index}`} style={{ marginBottom: '20px' }}>
            <div dangerouslySetInnerHTML={{ __html: item.passage.passageHtml }} />
          </div>
      );
      currentHeight += passageHeight; // 현재 높이에 지문 추가

      // 각 질문에 대해 처리
      item.questions.forEach((question, qIndex) => {
        const questionHeight = calculateHeight(question.questionHtml); // + 40; // 질문 높이 + 간격

        // 질문이 추가 가능한지 체크
        if (currentHeight + questionHeight > 270) {
          sections.push(<div key={`section-${index}-${qIndex}`} style={{ marginBottom: '0px' }} />);
          currentHeight = 0; // 높이 초기화
        }

        // 질문을 현재 섹션에 추가
        sections.push(
            <div key={`question-${index}-${qIndex}`} style={{ marginBottom: '0px' }}>
              <div style={{ fontSize: 20 }}>{qIndex + 1}.</div>
              <div style={{marginBottom: '25px'}} dangerouslySetInnerHTML={{ __html: question.questionHtml }} />
              {question.questionType === '객관식' ? (
                  question.options.map((option, optIndex) => (
                      <div key={`option-${index}-${qIndex}-${optIndex}`} dangerouslySetInnerHTML={{ __html: option[`choice${optIndex + 1}Html`] }} style={{marginBottom: '5px'}}/>
                  ))
              ) : (
                  <div>
                    <span>정답: </span>
                    <input type="text" />
                  </div>
              )}
              <div></div>
            </div>
        );
        currentHeight += questionHeight; // 현재 높이에 질문 추가
      });
    });

    return sections;
  };

  return (
      <>
        <CommonResource/>
        <Button onClick={handlePrint}>시험지 저장</Button>
      <div ref={pdfRef} style={{ textAlign: 'left', padding: '20px', backgroundColor: 'aliceblue', display: 'none'}} >
          {renderContent()}
      </div>
      </>
  );
};

export default Step4Component;
