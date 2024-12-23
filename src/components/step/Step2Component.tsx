import React, {useEffect, useRef, useState} from "react";
import CommonResource from "../../util/CommonResource";
import {useMutation, useQueries, useQuery, UseQueryResult} from "@tanstack/react-query";
import HomeIcon from '@mui/icons-material/Home';
import {
    getAdjustedChapterItemImagesFromTsherpa,
    getBookFromTsherpa,
    getEvaluationsFromTsherpa,
    getExamItemImagesFromTsherpa,
    getSimilarItemsImagesFromTsherpa
} from "../../api/step2Api";
// @ts-ignore
import useCustomMove from "../../hooks/useCustomMove";
import Button from "@mui/material/Button";
import ConfirmationModal from "../common/ConfirmationModal";
import "../../assets/css/confirmationModal.css";
import "../../assets/css/comboBox.css";
import {setExamData} from "../../slices/examDataSlice";
import {useDispatch, useSelector} from "react-redux";
import Step2RightSideComponent from "./Step2RightSideComponent";
// @ts-ignore
import ModalComponent from "../common/ModalComponent";
import DifficultyCountComponent from "../common/DifficultyCountComponent";
import {getDifficultyColor} from "../../util/difficultyColorProvider";
import ErrorReportModal from "../common/ErrorReportModalComponent";
import {useLocation} from "react-router-dom";
import ChapterScopeModalComponent from "../common/ChapterScopeModalComponent"
import {Item} from "../../type/Item";

interface GroupedItem {
    passageId: string | number;
    passageUrl?: string | null;
    items: Item[];
}

interface DifficultyCount {
    level: string;
    count: number;
}

interface ItemsRequestForm {
    activityCategoryList: string[];
    levelCnt: number[];
    minorClassification: string[];
    questionForm: string;
}

export default function Step2Component() {
    const dispatch = useDispatch();
    const [initialStep1Data, setInitialStep1Data] = useState<any>(null);
    const step1DataLoaded = useRef(false);
    const minorClassification = useRef<string[]>([]);
    const [isProblemOptionsOpen, setIsProblemOptionsOpen] = useState(false);
    const [isSortOptionsOpen, setIsSortOptionsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("문제만 보기");
    const [selectedSortOption, setSelectedSortOption] = useState("단원순");
    const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
    const [itemList, setItemList] = useState<Item[]>([]);
    const [tempItemList, setTempItemList] = useState<Item[]>([]);
    const [difficultyCounts, setDifficultyCounts] = useState<DifficultyCount[]>([
        {level: "최하", count: 0},
        {level: "하", count: 0},
        {level: "중", count: 0},
        {level: "상", count: 0},
        {level: "최상", count: 0}
    ]);
    const [tempDifficultyCounts, setTempDifficultyCounts] = useState<DifficultyCount[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSorted, setIsSorted] = useState(false);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isSimilarPage, setIsSimilarPage] = useState(false);
    const [similarItems, setSimilarItems] = useState<Item[]>([]);
    const [questionIndex, setQuestionIndex] = useState<number | null>(null);
    const [deletedItems, setDeletedItems] = useState<GroupedItem[]>([]);
    const [noSimilarItemsMessage, setNoSimilarItemsMessage] = useState("");
    const [isNoSimilarItemsModalOpen, setIsNoSimilarItemsModalOpen] = useState(false);
    const [isErrorReportOpen, setIsErrorReportOpen] = useState(false);
    const [lastAddedItemId, setLastAddedItemId] = useState<number | null>(null);
    const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    const step0ExamIdList = useSelector((state: any) => state.examIdSlice);
    console.log('Step0으로부터 전송된 시험지 ID 리스트: ', step0ExamIdList);

    const questionQueries = useQueries({
        queries: step0ExamIdList?.length
            ? step0ExamIdList.map((examId: number) => ({
                queryKey: ["questionData", examId],
                queryFn: () => getExamItemImagesFromTsherpa(examId),
                staleTime: 1000 * 3,
            }))
            : [],
    }) as UseQueryResult<{ itemList: Item[] }>[];

    const questionsDataFromExams = questionQueries
        .filter((query) => query.isSuccess)
        .map((query) => query.data!.itemList);

    const step1Data = useLocation().state?.data || null;
    console.log('Step1으로부터 전송된 데이터: ', step1Data);

    const questionsData = {
        data: step1Data?.apiResponse || []
    };
    console.log("Step1으로부터 전송된 문제 목록: ", questionsData);

    const fetchSimilarItems = (itemId: number, questionIndex: number) => {
        getSimilarItemsImagesFromTsherpa(itemId)
            .then((data: { itemList: Item[] }) => {
                if (data.itemList.length === 0) {
                    setNoSimilarItemsMessage("검색된 유사 문제가 없습니다.");
                    setIsNoSimilarItemsModalOpen(true);
                } else {
                    setSimilarItems(data.itemList);
                    setIsSimilarPage(true);
                    setQuestionIndex(questionIndex);
                    console.log("유사 문제 목록: ", data.itemList);
                }
            })
            .catch((error: any) => {
                console.error("유사 문제 가져오기 실패:", error);
            });
    };

    const handleOpenModal = () => setIsShiftModalOpen(true);
    const handleCloseShiftModal = () => setIsShiftModalOpen(false);
    const handleCloseNoSimilarItemsModal = () => setIsNoSimilarItemsModalOpen(false);
    const handleOpenErrorReport = (itemId: number) => {
        setSelectedItemId(itemId);
        setIsErrorReportOpen(true);
    };
    const handleCloseErrorReport = () => setIsErrorReportOpen(false);

    const bookId = useSelector((state: any) => state.bookIdSlice);
    console.log(`교재 ID: ${bookId}`);

    const {moveToStepWithData, moveToPath} = useCustomMove();

    const {data: bookData} = useQuery({
        queryKey: ['bookData', bookId],
        queryFn: () => getBookFromTsherpa(bookId),
        staleTime: 1000 * 3,
        enabled: !!bookId
    });
    console.log('교재 정보: ', bookData);

    const subjectName = bookData?.subjectInfoList?.[0]?.subjectName?.split('(')[0] || "과목명 없음";
    const author = bookData?.subjectInfoList?.[0]?.subjectName?.match(/\(([^)]+)\)/)?.[1] || "저자 정보 없음";
    const curriculumYear = bookData?.subjectInfoList?.[0]?.curriculumName || "년도 정보 없음";

    const {data: evaluationsData} = useQuery({
        queryKey: ['evaluationsData', bookId],
        queryFn: () => getEvaluationsFromTsherpa(bookId),
        staleTime: 1000 * 3
    });
    console.log('평가 영역 데이터: ', evaluationsData);

    const activityCategoryList = evaluationsData
        ? evaluationsData.evaluationList.map((evaluation: any) => evaluation.domainId)
        : [];

    console.log(`평가 영역 목록: ${activityCategoryList}`);

    const chapterNames = itemList.map(item => ({
        largeChapterName: item.largeChapterName,
        mediumChapterName: item.mediumChapterName,
        smallChapterName: item.smallChapterName,
        topicChapterName: item.topicChapterName
    }));

    const handleOpenScopeModal = () => setIsScopeModalOpen(true);
    const handleCloseScopeModal = () => setIsScopeModalOpen(false);

    const itemsRequestForm: ItemsRequestForm | null = initialStep1Data && initialStep1Data.activityCategoryList && initialStep1Data.difficultyCounts && initialStep1Data.selectedEvaluation && initialStep1Data.minorClassification
        ? {
            activityCategoryList: initialStep1Data.selectedEvaluation,
            levelCnt: initialStep1Data.counts.map((count: any) => count.targetCount),
            minorClassification: initialStep1Data.minorClassification,
            questionForm: initialStep1Data.questionForm
        }
        : null;
    console.log('문제 요청 양식: ', itemsRequestForm);

    const fetchQuestions = useMutation<{ data: { itemList: Item[] } }, Error, ItemsRequestForm>({
        mutationFn: (itemsRequestForm: ItemsRequestForm) => {
            console.log("fetchQuestions mutationFn 호출됨 - form:", itemsRequestForm);
            return getAdjustedChapterItemImagesFromTsherpa(itemsRequestForm);
        },
        onSuccess: (data) => {
            const newTempItemList = [...data.data.itemList];
            const counts = [
                {level: "최하", count: 0},
                {level: "하", count: 0},
                {level: "중", count: 0},
                {level: "상", count: 0},
                {level: "최상", count: 0}
            ];
            newTempItemList.forEach(item => {
                const difficulty = counts.find(d => d.level === item.difficultyName);
                if (difficulty) difficulty.count += 1;
            });

            setTempItemList(newTempItemList);
            setTempDifficultyCounts(counts);

            console.log('새로 받아 온 문제 목록: ', data.data.itemList);
            console.log('새로 받아 온 난이도 별 문제 수: ', counts);

            setIsConfirmOpen(true);
        },
        onError: (error) => {
            console.error("문항 재검색 실패: ", error);
        }
    });

    useEffect(() => {
        if (step0ExamIdList.length === 0 && (!step1Data || step1Data.length === 0)) {
            setIsAccessModalOpen(true);
        }
    }, []);

    const handleCloseAccessModal = () => {
        setIsShiftModalOpen(false);
        moveToPath('/');
    };

    useEffect(() => {
        if (!step1DataLoaded.current && step1Data) {
            setInitialStep1Data(step1Data);
            step1DataLoaded.current = true;
            minorClassification.current = [...(step1Data.minorClassification || [])];
        }
    }, [step1Data]);

    useEffect(() => {
        if (!isSorted && groupedItems.length > 0) {
            sortGroupedItems();
            setIsSorted(true);
        }
    }, [groupedItems]);

    useEffect(() => {
        if (step0ExamIdList?.length && questionsDataFromExams.length > 0 && itemList.length === 0) {
            const combinedData = {data: {itemList: questionsDataFromExams.flat()}};
            console.log("questionsData 전체 구조:", combinedData);
            console.log("questionsData.data.itemList 확인:", combinedData.data.itemList);

            setItemList(combinedData.data.itemList);
            setTempItemList(combinedData.data.itemList);
            organizeItems(combinedData.data.itemList);
        }
    }, [questionsDataFromExams]);

    useEffect(() => {
        if (questionsData?.data?.itemList && itemList.length === 0) {
            console.log("questionsData 전체 구조:", questionsData);
            console.log("questionsData.data.itemList 확인:", questionsData.data.itemList);

            setItemList(questionsData.data.itemList);
            setTempItemList(questionsData.data.itemList);
            organizeItems(questionsData.data.itemList);
        }
    }, [questionsData]);

    useEffect(() => {
        if (lastAddedItemId !== null) {
            scrollToNewItem(lastAddedItemId);
        }
    }, [itemList, lastAddedItemId]);

    const organizeItems = (items: Item[]) => {
        const passageGroups = items.reduce((acc, item) => {
            const passageId = item.passageId || "noPassage";
            if (!acc[passageId]) {
                acc[passageId] = {passageId, passageUrl: item.passageUrl, items: []};
            }
            acc[passageId].items.push(item);
            return acc;
        }, {} as Record<string | number, GroupedItem>);

        const groupedArray = Object.values(passageGroups as Record<string | number, GroupedItem>).map((group) => {
            const typedGroup = group as GroupedItem;
            typedGroup.items.sort((a, b) => a.itemNo - b.itemNo);
            return typedGroup;
        });

        groupedArray.sort((a, b) => {
            const firstItemA = a.items[0].itemNo;
            const firstItemB = b.items[0].itemNo;
            return firstItemA - firstItemB;
        });

        setGroupedItems(groupedArray);
        setIsSorted(false);
    };

    useEffect(() => {
        const counts: DifficultyCount[] = [
            {level: "최하", count: 0},
            {level: "하", count: 0},
            {level: "중", count: 0},
            {level: "상", count: 0},
            {level: "최상", count: 0}
        ];
        itemList.forEach(item => {
            const difficulty = counts.find(d => d.level === item.difficultyName);
            if (difficulty) difficulty.count += 1;
        });
        setDifficultyCounts(counts.filter(c => c.count > 0));
    }, [itemList]);
    console.log('난이도 별 문제 수: ', difficultyCounts);

    useEffect(() => {
        sortGroupedItems();
    }, [selectedSortOption]);

    const sortGroupedItems = () => {
        const sortedGroups = groupedItems.map(group => {
            const sortedItems = [...group.items];

            if (selectedSortOption === "단원순") {
                sortedItems.sort((a, b) =>
                    a.largeChapterId - b.largeChapterId ||
                    a.mediumChapterId - b.mediumChapterId ||
                    a.smallChapterId - b.smallChapterId ||
                    a.topicChapterId - b.topicChapterId
                );
            } else if (selectedSortOption === "난이도순") {
                const difficultyOrder = ["최하", "하", "중", "상", "최상"];
                sortedItems.sort((a, b) =>
                    difficultyOrder.indexOf(a.difficultyName) - difficultyOrder.indexOf(b.difficultyName)
                );
            } else if (selectedSortOption === "문제 형태순") {
                sortedItems.sort((a, b) =>
                    (a.questionFormCode <= 50 ? -1 : 1) - (b.questionFormCode <= 50 ? -1 : 1)
                );
            }

            return {...group, items: sortedItems};
        });

        setGroupedItems(sortedGroups);

        const newSortedItemList = sortedGroups.flatMap(group => group.items);
        setItemList(newSortedItemList);
    };

    useEffect(() => {
        document.body.style.transform = "scale(0.8)";
        document.body.style.transformOrigin = "top";
        return () => {
            (document.body.style as any).zoom = "100%";
            document.body.style.transform = "none";
        };
    }, []);

    const totalQuestions = itemList.length;

    const [forceRender, setForceRender] = useState(false);

    const handleReSearchClick = () => {
        if (itemsRequestForm) {
            fetchQuestions.mutate(itemsRequestForm, {
                onSuccess: () => {
                    setForceRender(!forceRender);
                }
            });
        } else {
            console.warn("itemsRequestForm 값이 존재하지 않습니다.");
        }
    };

    const handleConfirm = () => {
        setItemList([...tempItemList]);
        setDifficultyCounts([...tempDifficultyCounts]);
        setSimilarItems([]);
        setDeletedItems([]);
        setIsConfirmOpen(false);
        organizeItems(tempItemList);
    };

    const toggleProblemOptions = () => {
        setIsProblemOptionsOpen(!isProblemOptionsOpen);
        console.log("Step2RightSideComponent options open:", !isProblemOptionsOpen);
    };

    const toggleSortOptions = () => {
        setIsSortOptionsOpen(!isSortOptionsOpen);
        console.log("Sort options open:", !isSortOptionsOpen);
    };

    const handleOptionSelect = (option: string) => {
        setSelectedOption(option);
        setIsProblemOptionsOpen(false);
    };

    const handleSortOptionSelect = (option: string) => {
        setSelectedSortOption(option);
        setIsSortOptionsOpen(false);
    };

    const handleSimilarPageToggle = (itemId: number, questionIndex: number) => {
        fetchSimilarItems(itemId, questionIndex);
    };

    const handleDeleteItem = (itemId: number) => {
        const itemToDelete = itemList.find((item) => item.itemId === itemId);
        if (itemToDelete) {
            const relatedPassage = groupedItems.find(group => group.passageId === itemToDelete.passageId);
            const passageInfo = relatedPassage ? {
                passageId: relatedPassage.passageId,
                passageUrl: relatedPassage.passageUrl
            } : null;

            setDeletedItems((prevDeletedItems) => {
                const updatedDeletedItems = [...prevDeletedItems];
                const existingGroup = updatedDeletedItems.find(group => group.passageId === itemToDelete.passageId);

                if (existingGroup) {
                    existingGroup.items.push(itemToDelete);
                } else {
                    updatedDeletedItems.push({
                        passageId: itemToDelete.passageId,
                        passageUrl: passageInfo?.passageUrl,
                        items: [itemToDelete]
                    });
                }

                return updatedDeletedItems;
            });

            const updatedItemList = itemList.filter((item) => item.itemId !== itemId);
            setItemList(updatedItemList);

            const updatedGroupedItems = groupedItems.map((group) => ({
                ...group,
                items: group.items.filter((item) => item.itemId !== itemId),
            })).filter((group) => group.items.length > 0);

            setGroupedItems(updatedGroupedItems);
            setSelectedSortOption("사용자 정렬");
        }
    };

    const handleDeletePassage = (passageId: string | number) => {
        const itemsToDelete = itemList.filter((item) => item.passageId === passageId);

        setDeletedItems((prevDeletedItems) => [
            ...prevDeletedItems,
            {
                passageId: passageId,
                passageUrl: itemsToDelete[0]?.passageUrl || null,
                items: itemsToDelete,
            },
        ]);

        const updatedItemList = itemList.filter((item) => item.passageId !== passageId);
        setItemList(updatedItemList);

        const updatedGroupedItems = groupedItems.filter((group) => group.passageId !== passageId);
        setGroupedItems(updatedGroupedItems);
        setSelectedSortOption("사용자 정렬");
    };

    const scrollToNewItem = (newItemId: number) => {
        const newItemElement = document.getElementById(`question-${newItemId}`);
        if (newItemElement) {
            newItemElement.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
    };

    const handleAddItem = (newItem: Item) => {
        setItemList((prevItemList) => [...prevItemList, newItem]);
        setLastAddedItemId(newItem.itemId);

        setGroupedItems((prevGroupedItems) => {
            const existingGroup = prevGroupedItems.find(group => group.passageId === newItem.passageId);

            if (existingGroup) {
                return prevGroupedItems.map(group =>
                    group.passageId === newItem.passageId
                        ? {...group, items: [...group.items, newItem]}
                        : group
                );
            } else {
                return [
                    ...prevGroupedItems,
                    {passageId: newItem.passageId, passageUrl: newItem.passageUrl, items: [newItem]}
                ];
            }
        });

        setDeletedItems((prevDeletedItems) =>
            prevDeletedItems
                .map((group) => ({
                    ...group,
                    items: group.items.filter((item) => item.itemId !== newItem.itemId),
                }))
                .filter((group) => group.items.length > 0)
        );

        setSimilarItems((prevSimilarItems) =>
            prevSimilarItems.filter((item) => item.itemId !== newItem.itemId)
        );
    };

    const handleDragEnd = (result: any) => {
        const {destination, source, type} = result;

        if (!destination) return;

        const updatedGroups = JSON.parse(JSON.stringify(groupedItems));
        if (type === "PASSAGE_GROUP") {
            const [movedGroup] = updatedGroups.splice(source.index, 1);
            updatedGroups.splice(destination.index, 0, movedGroup);

            setGroupedItems(updatedGroups);

            const newSortedItemList = updatedGroups.flatMap((group: { items: any; }) => group.items);
            setItemList(newSortedItemList);
            setSelectedSortOption("사용자 정렬");

            console.log(`지문을 ${source.index}에서 ${destination.index}로 이동`);
        } else if (type === "ITEM") {
            const sourcePassageId = source.droppableId;
            const destinationPassageId = destination.droppableId;

            const sourcePassageIdNumber = Number(sourcePassageId);
            const destinationPassageIdNumber = Number(destinationPassageId);

            if (sourcePassageId !== destinationPassageId && sourcePassageId !== "noPassage" && destinationPassageId !== "noPassage") {
                console.log('다른 지문으로 이동할 수 없습니다.');
                handleOpenModal();
                return;
            }

            const groupIndex = updatedGroups.findIndex((group: { passageId: number; }) => {
                if (typeof group.passageId === "string" && group.passageId === sourcePassageId) {
                    return true;
                }

                return typeof group.passageId === "number" && group.passageId === sourcePassageIdNumber;

            });

            if (groupIndex === -1) {
                console.error('해당 지문 그룹을 찾을 수 없습니다.');
                return;
            }

            const group = updatedGroups[groupIndex];

            const itemIndexInGroup = source.index - itemList.findIndex(item => item.passageId === sourcePassageIdNumber);

            if (itemIndexInGroup < 0 || itemIndexInGroup >= group.items.length) {
                console.error('item 인덱스가 존재하지 않습니다.');
                return;
            }

            const [movedItem] = group.items.splice(itemIndexInGroup, 1);

            if (!movedItem || !movedItem.itemId) {
                console.error(`movedItem이 올바르지 않거나 itemId가 존재하지 않습니다: `, movedItem);
                return;
            }

            const destinationIndexInGroup = destination.index - itemList.findIndex(item => item.passageId === destinationPassageIdNumber);

            group.items.splice(destinationIndexInGroup, 0, movedItem);

            setGroupedItems(updatedGroups);

            const newSortedItemList = updatedGroups.flatMap((group: { items: any; }) => group.items);
            setItemList(newSortedItemList);
            setSelectedSortOption("사용자 정렬");
        }
    };

    const handleClickMoveToStepOne = () => {
        console.log('STEP 1 단원 선택');
        moveToStepWithData('../exam/step1', bookId);
    };

    const handleClickMoveToStepThree = () => {
        console.log(`STEP 3 시험지 저장 : bookId=${bookId}, totalQuestions=${totalQuestions}, itemList=${JSON.stringify(itemList)}`);
        dispatch(setExamData({bookId, totalQuestions, groupedItems, step1Data}));
        moveToStepWithData('step3', {bookId, groupedItems});
    };
    const handleClickHome = () => {
        moveToPath('/');
    };
    // @ts-ignore
    return (
        <>
            <Button
                variant={'outlined'}
                onClick={handleClickHome}
                style={{
                    position: 'relative',
                    top: '55px',
                    right: '-50%',
                    zIndex: 1000,
                    margin: '5px'
                }}
            >
                <HomeIcon/>홈
            </Button>
            <CommonResource/>
            {isConfirmOpen && (
                <ConfirmationModal
                    title="문항 재검색"
                    message="문항 구성이 자동으로 변경됩니다."
                    details={tempDifficultyCounts.filter(count => count.count > 0)}
                    onCancel={() => setIsConfirmOpen(false)}
                    onConfirm={handleConfirm}
                />
            )}
            <ModalComponent
                title="비정상적인 접근"
                content={
                    <>비정상적인 접근이 감지되었습니다.<br/>
                        메인 페이지로 이동합니다.</>
                }
                handleClose={handleCloseAccessModal}
                open={isAccessModalOpen}
            />
            <ModalComponent
                title="이동 불가"
                content="다른 지문으로 이동할 수 없습니다."
                handleClose={handleCloseShiftModal}
                open={isShiftModalOpen}
            />
            <ModalComponent
                title="검색 결과 없음"
                content={noSimilarItemsMessage}
                handleClose={handleCloseNoSimilarItemsModal}
                open={isNoSimilarItemsModalOpen}
            />
            <ErrorReportModal itemId={selectedItemId} isOpen={isErrorReportOpen} onClose={handleCloseErrorReport}/>
            <div id="wrap" className="full-pop-que">
                <div className="full-pop-wrap">
                    <div className="pop-header">
                        <ul className="title">
                            <li>STEP 1 단원선택</li>
                            <li className="active">STEP 2 문항 편집</li>
                            <li>STEP 3 시험지 저장</li>
                        </ul>
                        <button type="button" className="del-btn"></button>
                    </div>
                    <div className="pop-content">
                        <div className="view-box" style={{
                            border: '2px solid #1976d2',
                            width: '103%',
                            height: '850px',
                            margin: 'auto',
                        }}>

                            <div className="view-top">
                                <div className="paper-info">
                                    <span>{subjectName}</span> {author}({curriculumYear})
                                </div>
                                {minorClassification.current.length > 0 && (
                                    <button className="btn-default btn-research" onClick={handleReSearchClick}>
                                        <i className="research"></i>재검색
                                    </button>
                                )}
                                <button className="tn-default pop-btn" onClick={handleOpenScopeModal}>
                                    출제범위
                                </button>
                                <ChapterScopeModalComponent
                                    open={isScopeModalOpen}
                                    onClose={handleCloseScopeModal}
                                    subjectName={subjectName}
                                    author={author}
                                    curriculumYear={curriculumYear}
                                    chapters={chapterNames}
                                />
                            </div>
                            <div className="view-bottom type01">
                                <div className="cnt-box">
                                    <div className="cnt-top">
                                        <span className="title">문제 목록</span>
                                        <div className="right-area">
                                            <div className="select-wrap">
                                                <button
                                                    type="button"
                                                    className="select-btn"
                                                    onClick={toggleProblemOptions}
                                                >
                                                    {selectedOption}
                                                </button>
                                                {isProblemOptionsOpen && (
                                                    <ul className="select-list open">
                                                        <li>
                <span onClick={() => handleOptionSelect("문제만 보기")}>
                    문제만 보기
                </span>
                                                        </li>
                                                        <li>
                <span onClick={() => handleOptionSelect("문제+정답 보기")}>
                    문제+정답 보기
                </span>
                                                        </li>
                                                        <li>
                <span onClick={() => handleOptionSelect("문제+정답+해설 보기")}>
                    문제+정답+해설 보기
                </span>
                                                        </li>
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="select-wrap">
                                                <button
                                                    type="button"
                                                    className="select-btn"
                                                    onClick={toggleSortOptions}
                                                >
                                                    {selectedSortOption}
                                                </button>
                                                {isSortOptionsOpen && (
                                                    <ul className="select-list open">
                                                        <li>
                                                            <span onClick={() => handleSortOptionSelect("사용자 정렬")}>
                                                                사용자 정렬
                                                            </span>
                                                        </li>
                                                        <li>
                                                            <span onClick={() => handleSortOptionSelect("단원순")}>
                                                                단원순
                                                            </span>
                                                        </li>
                                                        <li>
                                                            <span onClick={() => handleSortOptionSelect("난이도순")}>
                                                                난이도순
                                                            </span>
                                                        </li>
                                                        <li>
                                                            <span onClick={() => handleSortOptionSelect("문제 형태순")}>
                                                                문제 형태순
                                                            </span>
                                                        </li>
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="view-que-list scroll-inner">
                                        {groupedItems.length > 0 ? (
                                            groupedItems.map((group, groupIndex) => (
                                                <div key={`group-${group.passageId}-${groupIndex}`}
                                                     className="passage-group">
                                                    {group.passageId !== "noPassage" && (
                                                        <div className="passage-group-wrapper" style={{
                                                            border: "1px solid #ddd",
                                                            padding: "20px",
                                                            borderRadius: "8px",
                                                            marginBottom: "20px",
                                                            position: "relative",
                                                            width: "100%",
                                                            boxSizing: "border-box"
                                                        }}>
                                                            <div className="passage-group-header" style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "flex-start",
                                                                borderBottom: "1px solid #ddd",
                                                                paddingBottom: "5px",
                                                                marginBottom: "10px"
                                                            }}>
<span style={{fontSize: "18px", fontWeight: "bold", marginTop: "-10px"}}>
    {group.items.length === 1
        ? itemList.indexOf(group.items[0]) + 1
        : `${itemList.indexOf(group.items[0]) + 1} ~ ${itemList.indexOf(group.items[group.items.length - 1]) + 1}`}
</span>
                                                            </div>

                                                            <button type="button" className="btn-delete-2" style={{
                                                                position: "absolute",
                                                                right: "40px",
                                                                top: "10px",
                                                                zIndex: "2",
                                                                width: "22px",
                                                                height: "22px",
                                                                fontSize: "16px"
                                                            }}
                                                                    onClick={() => handleDeletePassage(group.passageId)}
                                                            >
                                                            </button>
                                                            <div className="passage" style={{
                                                                border: "1px solid #ccc",
                                                                borderRadius: "8px",
                                                                padding: "10px",
                                                                overflow: "hidden",
                                                                width: "100%",
                                                                boxSizing: "border-box"
                                                            }}>
                                                                <img
                                                                    src={group.passageUrl || ""}
                                                                    alt="지문 이미지"
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "auto",
                                                                        objectFit: "contain"
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {group.items.map((item, index) => (
                                                        <div key={`item-${item.itemId}-${index}`}
                                                             id={`question-${item.itemId}`}
                                                             className="view-que-box"
                                                             style={{marginTop: "10px"}}>
                                                            <div className="que-top">
                                                                <div className="title">
                                                                    <span
                                                                        className="num">{itemList.indexOf(item) + 1}</span>
                                                                    <div className="que-badge-group">
                                    <span className={`que-badge ${getDifficultyColor(item.difficultyName)}`}>
                                        {item.difficultyName}
                                    </span>
                                                                        <span className="que-badge gray">
                                        {item.questionFormCode <= 50 ? "객관식" : "주관식"}
                                    </span>
                                                                    </div>
                                                                </div>
                                                                <div className="btn-wrap">
                                                                    <button type="button" className="btn-error pop-btn"
                                                                            onClick={() => handleOpenErrorReport(item.itemId)}
                                                                    ></button>

                                                                    <button type="button"
                                                                            className="btn-delete"
                                                                            onClick={() => handleDeleteItem(item.itemId)}
                                                                    >
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="view-que">
                                                                <div className="que-content">
                                                                    {item.questionUrl ? (
                                                                        <img src={item.questionUrl} alt="문제 이미지"/>
                                                                    ) : (
                                                                        <p className="txt">문제 텍스트 없음</p>
                                                                    )}
                                                                </div>
                                                                <div className="que-bottom">
                                                                    {(selectedOption === "문제+정답 보기" || selectedOption === "문제+정답+해설 보기") && (
                                                                        <div className="data-area">
                                                                            <div className="que-info">
                                                                                <p className="answer">
                                                                                    <span className="label type01"
                                                                                          style={{
                                                                                              display: "block",
                                                                                              textAlign: "left",
                                                                                              paddingLeft: "20px"
                                                                                          }}>정답</span>
                                                                                </p>
                                                                                <div className="data-answer-area">
                                                                                    {item.answerUrl ? (
                                                                                        <img src={item.answerUrl}
                                                                                             alt="정답 이미지"/>
                                                                                    ) : (
                                                                                        <div className="paragraph"
                                                                                             style={{textAlign: "justify"}}>
                                                                                            <span
                                                                                                className="txt">정답 없음</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {selectedOption === "문제+정답+해설 보기" && (
                                                                        <div className="data-area">
                                                                            <div className="que-info">
                                                                                <p className="answer">
                                                                                    <span className="label" style={{
                                                                                        display: "block",
                                                                                        textAlign: "left",
                                                                                        paddingLeft: "20px"
                                                                                    }}>해설</span>
                                                                                </p>
                                                                                <div className="data-answer-area">
                                                                                    {item.explainUrl ? (
                                                                                        <img src={item.explainUrl}
                                                                                             alt="해설 이미지"/>
                                                                                    ) : (
                                                                                        <div className="paragraph"
                                                                                             style={{textAlign: "justify"}}>
                                                                                            <span
                                                                                                className="txt">해설 없음</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="data-area type01">
                                                                        <button
                                                                            type="button"
                                                                            className="btn-similar-que btn-default"
                                                                            onClick={() => handleSimilarPageToggle(item.itemId, itemList.indexOf(item) + 1)}
                                                                        >
                                                                            <i className="similar"></i> 유사 문제
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="que-info-last">
                                                                <p className="chapter">
                                                                    {item.largeChapterName} &gt; {item.mediumChapterName} &gt; {item.smallChapterName} &gt; {item.topicChapterName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        ) : (
                                            <div>문제가 없습니다.</div>
                                        )}
                                    </div>
                                    <DifficultyCountComponent
                                        difficultyCounts={difficultyCounts}
                                        getDifficultyColor={getDifficultyColor}
                                        totalQuestions={totalQuestions}
                                    />
                                </div>
                                <div className="cnt-box type01">
                                    <Step2RightSideComponent
                                        itemList={itemList}
                                        onDragEnd={handleDragEnd}
                                        onShowSimilar={(item: number | Item) => handleSimilarPageToggle(
                                            typeof item === 'number' ? item : item.itemId,
                                            itemList.indexOf(item as Item) + 1
                                        )}
                                        questionIndex={questionIndex ?? 0}
                                        similarItems={similarItems}
                                        deletedItems={deletedItems.flatMap(group => group.items)}
                                        onAddItem={handleAddItem}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="step-btn-wrap">
                        <Button
                            variant="contained"
                            onClick={handleClickMoveToStepOne}
                            className="btn-step"
                        ><b>단원 선택</b>
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleClickMoveToStepThree}
                            className="btn-step next"
                            style={{
                                right: '50px',
                                float: 'right',
                                marginRight: '-90px'
                            }}
                        ><b>시험지 저장</b>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
