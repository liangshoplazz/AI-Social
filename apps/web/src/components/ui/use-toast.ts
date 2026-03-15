export const toast = {
  toast: (opts: { title?: string; description?: string }) => {
    // 生产环境先做 no-op + console，避免因为缺 toast 导致整个点击流程挂掉
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[toast]", opts.title ?? "", opts.description ?? "");
    }
  },
};

// 可选：如果项目里有人用 useToast()，也给一个兼容实现
export function useToast() {
  return { toast: toast.toast };
}
