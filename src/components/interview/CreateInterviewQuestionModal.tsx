import { useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { InterviewOutlineQuestion, InterviewQuestionType } from '../../utils/researchProjectStore';

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export type CreateInterviewQuestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** null = 新建 */
  editing: InterviewOutlineQuestion | null;
  onSave: (question: InterviewOutlineQuestion) => void;
};

function emptyOptionsForType(type: InterviewQuestionType): string[] {
  if (type === 'open') return [];
  return ['', ''];
}

export default function CreateInterviewQuestionModal({
  isOpen,
  onClose,
  editing,
  onSave,
}: CreateInterviewQuestionModalProps) {
  const [content, setContent] = useState('');
  const [aiHint, setAiHint] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [imageName, setImageName] = useState<string | undefined>();
  const [type, setType] = useState<InterviewQuestionType>('open');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editing) {
      setContent(editing.content);
      setAiHint(editing.aiHint ?? '');
      setImageDataUrl(editing.imageDataUrl);
      setImageName(undefined);
      setType(editing.type);
      setOptions(
        editing.type === 'open'
          ? ['', '']
          : editing.options && editing.options.length > 0
            ? [...editing.options]
            : ['', ''],
      );
    } else {
      setContent('');
      setAiHint('');
      setImageDataUrl(undefined);
      setImageName(undefined);
      setType('open');
      setOptions(['', '']);
    }
  }, [isOpen, editing]);

  if (!isOpen) return null;

  const onPickImage = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    if (!IMAGE_ACCEPT.includes(file.type)) {
      setError('请上传 JPG、PNG、WebP 或 GIF 格式图片');
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError('图片大小不能超过 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === 'string' ? reader.result : undefined);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleTypeChange = (next: InterviewQuestionType) => {
    setType(next);
    setOptions(emptyOptionsForType(next));
  };

  const handleSave = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('请填写问题内容');
      return;
    }
    let opts = options.map((o) => o.trim()).filter(Boolean);
    if (type === 'single' || type === 'multi') {
      if (opts.length < 2) {
        setError('单选题 / 多选题至少需要 2 个有效选项');
        return;
      }
    } else {
      opts = [];
    }
    const id = editing?.id ?? `iq-${Date.now()}`;
    const order = editing?.order ?? 0;
    onSave({
      id,
      order,
      content: trimmed,
      aiHint: aiHint.trim() || undefined,
      imageDataUrl,
      type,
      options: opts.length > 0 ? opts : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-white">{editing ? '编辑问题' : '创建问题'}</h2>
            <p className="mt-1 text-sm text-zinc-400">输入问题内容、上传图片和设置问题类型</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="关闭">
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-200">问题内容</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入问题内容..."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary/50"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-zinc-200">AI 提示（可选）</span>
            <textarea
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
              placeholder="例如：选择「其他」选项时需要用户输入具体内容；选择「不感兴趣」时终止访谈"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary/50"
            />
            <p className="mt-2 text-xs text-zinc-500">
              用自然语言描述 AI 处理此问题的特殊行为，如弹出输入框、跳题、终止访谈等
            </p>
          </label>

          <div className="mt-5">
            <span className="mb-2 block text-sm font-medium text-zinc-200">问题配图（可选）</span>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-8 transition-colors hover:border-white/30 hover:bg-black/30">
              <Upload className="mb-2 h-8 w-8 text-zinc-500" />
              <span className="text-sm text-zinc-400">点击上传图片</span>
              <span className="mt-1 text-xs text-zinc-500">支持 JPG, PNG, WebP, GIF 格式，最大 10MB</span>
              <input
                type="file"
                accept={IMAGE_ACCEPT.join(',')}
                className="hidden"
                onChange={(e) => onPickImage(e.target.files)}
              />
            </label>
            {(imageName || imageDataUrl) && (
              <div className="mt-2 flex items-center gap-3">
                {imageDataUrl && (
                  <img src={imageDataUrl} alt="" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImageDataUrl(undefined);
                    setImageName(undefined);
                  }}
                  className="text-xs text-zinc-400 underline hover:text-white"
                >
                  移除图片
                </button>
              </div>
            )}
          </div>

          <div className="mt-5">
            <span className="mb-3 block text-sm font-medium text-zinc-200">问题类型</span>
            <div className="space-y-2">
              {(
                [
                  { key: 'open' as const, label: '开放式问题' },
                  { key: 'single' as const, label: '单选题' },
                  { key: 'multi' as const, label: '多选题' },
                ] as const
              ).map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:bg-black/30"
                >
                  <input
                    type="radio"
                    name="qtype"
                    checked={type === key}
                    onChange={() => handleTypeChange(key)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-zinc-200">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {(type === 'single' || type === 'multi') && (
            <div className="mt-5">
              <span className="mb-2 block text-sm font-medium text-zinc-200">选项</span>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`选项 ${idx + 1}`}
                      className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary/50"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                        className="shrink-0 rounded-lg border border-white/15 px-2 text-xs text-zinc-400 hover:bg-white/10"
                      >
                        删
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOptions([...options, ''])}
                className="mt-2 text-sm text-primary hover:text-primary/80"
              >
                + 添加选项
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/10">
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-100"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
