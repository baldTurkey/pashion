import { CheckCircle2 } from "lucide-react";

export default function ThanksBuying() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 rounded-2xl bg-emerald-500 p-8 text-center">
      <p className="rounded-xl bg-emerald-900 px-4 py-2 text-3xl font-semibold text-white">
        Thank you for Buying!
      </p>
      <div className="rounded-full bg-white p-3 text-emerald-900">
        <CheckCircle2 size={96} />
      </div>
    </div>
  );
}
