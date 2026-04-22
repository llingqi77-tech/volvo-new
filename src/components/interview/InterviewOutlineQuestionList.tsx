import { Fragment, useMemo } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, List } from 'lucide-react';
import type { InterviewOutlineQuestion } from '../../utils/researchProjectStore';

function SortableRow({
  item,
  index,
  onEdit,
  onDelete,
}: {
  item: InterviewOutlineQuestion;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-stretch gap-3 rounded-xl border border-white/10 bg-zinc-800/80 px-3 py-3"
    >
      <button
        type="button"
        className="flex shrink-0 cursor-grab touch-none items-center text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        aria-label="拖动排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-black">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-relaxed text-white">{item.content}</p>
        {item.type !== 'open' && item.options && item.options.length > 0 && (
          <p className="mt-1 text-xs text-zinc-500">选项：{item.options.join(' · ')}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(item.id)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <Pencil size={14} />
          编辑
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-300"
          aria-label="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export type InterviewOutlineQuestionListProps = {
  questions: InterviewOutlineQuestion[];
  onReorder: (next: InterviewOutlineQuestion[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
};

export default function InterviewOutlineQuestionList({
  questions,
  onReorder,
  onEdit,
  onDelete,
  onAdd,
}: InterviewOutlineQuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = useMemo(() => [...questions].sort((a, b) => a.order - b.order), [questions]);
  const ids = useMemo(() => sorted.map((q) => q.id), [sorted]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((q) => q.id === active.id);
    const newIndex = sorted.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(sorted, oldIndex, newIndex) as InterviewOutlineQuestion[];
    onReorder(moved.map((q, idx) => ({ ...q, order: idx })));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-zinc-900/50">
      <div className="shrink-0 border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <List className="mt-0.5 h-5 w-5 text-zinc-400" />
            <div>
              <h3 className="text-base font-bold text-white">问题列表（{sorted.length}）</h3>
              <p className="mt-1 text-xs text-zinc-500">管理您的访谈问题，为每个问题配置图片和类型</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="shrink-0 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
          >
            添加问题
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {sorted.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">暂无问题，点击「添加问题」开始编写访谈大纲。</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {sorted.map((q, idx) => (
                <Fragment key={q.id}>
                  <SortableRow item={q} index={idx} onEdit={onEdit} onDelete={onDelete} />
                </Fragment>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
