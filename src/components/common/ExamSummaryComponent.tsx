import React from "react";
// @ts-ignore
import {Draggable, DraggableProvided, DraggableStateSnapshot, Droppable, DroppableProvided} from "react-beautiful-dnd";
import QuestionTypeCountComponent from "./QuestionTypeCountComponent";
import {Item} from "../../type/Item";

interface GroupedItems {
    [passageId: string]: Item[];
}

interface ExamSummaryComponentProps {
    itemList: Item[];
    groupedItems: GroupedItems;
}

const ExamSummaryComponent: React.FC<ExamSummaryComponentProps> = ({itemList, groupedItems}) => {
    const sortedGroupedItems = Object.keys(groupedItems)
        .map((passageId) => ({
            passageId,
            items: groupedItems[passageId],
            firstIndex: itemList.findIndex((i) => i.itemId === groupedItems[passageId][0].itemId),
        }))
        .sort((a, b) => a.firstIndex - b.firstIndex);

    const handleScrollToQuestion = (itemId: number) => {
        const element = document.getElementById(`question-${itemId}`);
        if (element) {
            element.scrollIntoView({behavior: "smooth", block: "center"});
        }
    };

    const truncateText = (text: string, maxLength: number): string => {
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    };

    return (
        <div className="contents on">
            <div className="table half-type no-passage" style={{overflowY: "auto", maxHeight: "100%"}}>
                <div
                    className="fix-head"
                    style={{position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1}}
                >
                    <span className="move-header" style={{marginLeft: "5px"}}>
                        이동
                    </span>
                    <span className="number-header" style={{marginLeft: "10px"}}>
                        번호
                    </span>
                    <span className="question-form-header" style={{marginLeft: "70px"}}>
                        문제 형태
                    </span>
                    <span className="question-type-header" style={{marginRight: "20px"}}>
                        문제 유형
                    </span>
                    <span className="difficulty-header" style={{marginRight: "18px"}}>
                        난이도
                    </span>
                </div>
                <div className="table-body" style={{overflowY: "auto", maxHeight: "32.23em"}}>
                    <Droppable droppableId="passageGroups" type="PASSAGE_GROUP">
                        {(provided: DroppableProvided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="test ui-sortable"
                                id="table-1"
                            >
                                {sortedGroupedItems.map(({passageId, items}, groupIndex) => (
                                    <Draggable
                                        key={`passage-${passageId}`}
                                        draggableId={`passage-${passageId}`}
                                        index={groupIndex}
                                        isDragDisabled={passageId === "noPassage"}
                                    >
                                        {(provided: DraggableStateSnapshot, snapshot: DraggableStateSnapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`depth-01 ${
                                                    passageId !== "noPassage" ? "has-passage" : "no-passage"
                                                }`}
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    transform: snapshot.isDragging
                                                        ? `${provided.draggableProps.style?.transform} translateY(40px)`
                                                        : provided.draggableProps.style?.transform,
                                                    marginTop: snapshot.isDragging ? "60px" : "0px",
                                                    zIndex: snapshot.isDragging ? 1000 : undefined,
                                                }}
                                            >
                                                {passageId !== "noPassage" && (
                                                    <div
                                                        className="dragHandle ui-sortable-handle ico-move-type02"
                                                        {...provided.dragHandleProps}
                                                    ></div>
                                                )}

                                                <Droppable droppableId={`${passageId}`} type="ITEM">
                                                    {(innerProvided: DraggableProvided) => (
                                                        <div
                                                            ref={innerProvided.innerRef}
                                                            {...innerProvided.droppableProps}
                                                            className="col-group"
                                                        >
                                                            {items.map((item) => {
                                                                const overallIndex = itemList.findIndex(
                                                                    (i) => i.itemId === item.itemId
                                                                );
                                                                return (
                                                                    <Draggable
                                                                        key={`item-${item.itemId}`}
                                                                        draggableId={`item-${item.itemId}`}
                                                                        index={overallIndex}
                                                                    >
                                                                        {(provided: DraggableProvided) => (
                                                                            <div
                                                                                className="col depth-02"
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                onClick={() =>
                                                                                    handleScrollToQuestion(item.itemId)
                                                                                }
                                                                            >
                                                                                <a href="#">
                                                                                    <span
                                                                                        className="dragHandle ui-sortable-handle ico-move-type01"></span>
                                                                                    <span>{overallIndex + 1}</span>
                                                                                    <span className="tit">
                                                                                        <div className="txt">
                                                                                            {truncateText(
                                                                                                `${item.largeChapterName} > ${item.mediumChapterName} > ${item.smallChapterName} > ${item.topicChapterName}`,
                                                                                                30
                                                                                            )}
                                                                                        </div>
                                                                                    </span>
                                                                                    <span
                                                                                        className="question-type-data">
                                                                                        {item.questionFormCode <= 50
                                                                                            ? "객관식"
                                                                                            : "주관식"}
                                                                                    </span>
                                                                                    <span>
                                                                                        <span
                                                                                            className={`que-badge ${item.difficultyName}`}
                                                                                        >
                                                                                            {item.difficultyName}
                                                                                        </span>
                                                                                    </span>
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                );
                                                            })}
                                                            {innerProvided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
            <QuestionTypeCountComponent itemList={itemList}/>
        </div>
    );
};

export default ExamSummaryComponent;
