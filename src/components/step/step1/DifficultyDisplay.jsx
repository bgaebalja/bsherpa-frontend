import React, { useState ,useEffect} from 'react';

const DifficultyDisplay = ({ isStudent = false ,countsData, handleDifficultyCounts,handleIsConfirm,  handleCloseDifficultyPopup  // 추가
} ) => {
  const [selectedSteps, setSelectedSteps] = useState(['step2', 'step3', 'step4']);
  const [showRangePopup, setShowRangePopup] = useState(false);
  const [showAutoChangePopup, setShowAutoChangePopup] = useState(false);
  const [counts, setCounts] = useState({
    step1: 0,
    step2: 10,
    step3: 10,
    step4: 10,
    step5: 0
  });

  // props로 difficultyCounts를 받아서 업데이트
  useEffect(() => {
    if (countsData) {
      setCounts(countsData);
    }
  }, [countsData]);






  const handleSave = () => {
    const total = Object.values(difficultyValues).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
    
    if (total !== 30) {
      alert('난이도별 문항 수의 합이 30문제가 되어야 합니다.');
      return;
    }

    handleDifficultyCounts(difficultyValues);
    handleCloseDifficultyPopup();  // 팝업 닫기 추가
  };

  
  const difficulties = [
    { step: 'step1', text: '최하', color: 'color01', disabled: true },
    { step: 'step2', text: '하', color: 'color02', disabled: false },
    { step: 'step3', text: '중', color: 'color03', disabled: false },
    { step: 'step4', text: '상', color: 'color04', disabled: false },
    { step: 'step5', text: '최상', color: 'color05', disabled: true }
  ];

 // handleInputChange 함수 수정
 const handleInputChange = (step, value) => {
  const newValue = parseInt(value) || 0;
  
  // 입력된 값이 음수인 경우 0으로 설정
  if (newValue < 0) return;

  // 새로운 counts 객체 생성
  const newCounts = {
    ...counts,
    [step]: newValue
  };

  // 상태 업데이트
  setCounts(newCounts);
  // 부모 컴포넌트에 즉시 알림
  handleDifficultyCounts(newCounts);
};


  const handleStepClick = (step) => {
    // 비활성화된 버튼이나 학생용일 경우 클릭 무시
    const difficulty = difficulties.find(d => d.step === step);
    if (difficulty.disabled || isStudent) return;

    setSelectedSteps(prev => 
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

// handleAutoChange 함수 수정
const handleAutoChange = () => {
  handleDifficultyCounts(counts);
  setShowAutoChangePopup(false);
  setShowRangePopup(false);
  handleIsConfirm(true);
};


  return (
    <div className="difficulty-section">
      <div className="box">
        <div className="title-wrap">
          <span className="tit-text">난이도 구성</span>
        </div>
        <div className="step-wrap">
          {difficulties.map(({ step, text, color, disabled }) => (
            <button
              key={step}
              type="button"
              className={`btn-line type02 ${
                selectedSteps.includes(step) ? `${color} active` : ''
              } ${disabled || isStudent ? 'disabled' : ''}`}
              onClick={() => handleStepClick(step)}
              disabled={disabled || isStudent}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="box">
        <div className="title-wrap">
          <span className="tit-text">
            난이도별 문제 수
            <button
              type="button"
              className="btn-icon2 pop-btn"
              onClick={() => setShowRangePopup(true)}
              disabled={isStudent}
            >
              <i className="setting"></i>
            </button>
          </span>
        </div>
        <div className="step-wrap">
          {difficulties.map(({ step, text, color }) => (
            selectedSteps.includes(step) && (
              <div
                key={step}
                className={`btn-line type02 ${color} active`}
              >
                {text}({counts[step]})
              </div>
            )
          ))}
        </div>
      </div>









{/* 팝업 */}
{showRangePopup && !isStudent && (
  <div className="popup-overlay">
    <div className="popup-content">
      <div className="pop-header">
        <span>난이도별 문제 수 설정</span>
        <button
          type="button"
          className="pop-close"
          onClick={() => setShowRangePopup(false)}
        ></button>
      </div>
      <div className="pop-content">
        <span className="txt">
          문제 수를 입력하여<br />
          난이도별 문제 수를 조정하세요.
        </span>
        <div className="range-wrap">
          {difficulties.map(({ step, text, color, disabled }) => (
            <div key={step} className={`range ${color}`}>
              <span className={color}>{text}</span>
              <div className="input-group" style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  className="decrease-btn"
                  onClick={() => {
                    if (!disabled) {
                      setCounts(prev => ({
                        ...prev,
                        [step]: Math.max(0, (prev[step] || 0) - 1)
                      }));
                    }
                  }}
                  disabled={disabled || counts[step] <= 0}
                >
                  -
                </button>
                <input
                  type="number"
                  value={counts[step]}
                  onChange={(e) =>
                    setCounts(prev => ({
                      ...prev,
                      [step]: parseInt(e.target.value) || 0
                    }))
                  }
                  disabled={disabled}
                />
                <button 
                  className="increase-btn"
                  onClick={() => {
                    if (!disabled) {
                      setCounts(prev => ({
                        ...prev,
                        [step]: (prev[step] || 0) + 1
                      }));
                    }
                  }}
                  disabled={disabled}
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <div className="range total">
            <span>합계</span>
            <span className="num">
              {Object.values(counts).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>
      </div>
      <div className="pop-footer">
        <button onClick={() => {
          setCounts({
            step1: 0,
            step2: 0,
            step3: 0,
            step4: 0,
            step5: 0
          });
        }}>
          초기화
        </button>
        <button
          className={
            Object.values(counts).reduce((a, b) => a + b, 0) !== 20 
              ? 'disabled' 
              : ''
          }
          onClick={() => {
            if (Object.values(counts).reduce((a, b) => a + b, 0) === 20) {
              setShowRangePopup(false);
            } else {
              setShowAutoChangePopup(true);
            }
            handleAutoChange()
            handleIsConfirm(true)
          }}
        >
          저장
        </button>
      </div>
    </div>
  </div>
)}

<style jsx>{`
  .input-group {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .decrease-btn,
  .increase-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
  }

  .decrease-btn:hover,
  .increase-btn:hover {
    background: #f5f5f5;
  }

  .decrease-btn:disabled,
  .increase-btn:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.5;
  }

  input[type="number"] {
    width: 60px;
    text-align: center;
    padding: 4px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
`}</style>

      

      <style jsx>{`
        .difficulty-section {
          padding: 20px;
        }
        .box {
          margin-bottom: 20px;
        }
        .title-wrap {
          margin-bottom: 15px;
        }
        .tit-text {
          font-size: 16px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .step-wrap {
          display: flex;
          gap: 10px;
        }
        .btn-line {
          height: 36px;
          padding: 0 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          cursor: pointer;
        }
        .btn-line.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        .btn-icon2 {
          margin-left: 8px;
          background: none;
          border: none;
          cursor: pointer;
        }
        .btn-icon2:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .setting:before {
          content: "⚙️";
          font-size: 16px;
        }
        
        /* Color styles - only applied when active */
        .color01.active { background: #FF7170; color: white; border-color: #FF7170; }
        .color02.active { background: #FF9C52; color: white; border-color: #FF9C52; }
        .color03.active { background: #FFCD51; color: white; border-color: #FFCD51; }
        .color04.active { background: #9BE15D; color: white; border-color: #9BE15D; }
        .color05.active { background: #52C5FF; color: white; border-color: #52C5FF; }

        /* Popup color styles */
        .range .color01 { color: #FF7170; }
        .range .color02 { color: #FF9C52; }
        .range .color03 { color: #FFCD51; }
        .range .color04 { color: #9BE15D; }
        .range .color05 { color: #52C5FF; }

        /* Popup styles */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .popup-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
        }
        .pop-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
        }
        .pop-content {
          padding: 20px;
        }
        .pop-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        .txt {
          text-align: center;
          display: block;
          margin: 10px 0;
        }
        .range-wrap {
          margin: 20px 0;
        }
        .range {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
          padding: 8px;
        }
        .range input {
          width: 60px;
          padding: 4px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .range input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default DifficultyDisplay;