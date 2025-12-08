interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-3 glass-dark rounded-2xl text-white border border-white/10 focus:border-cyan-400/50 transition-all duration-300"
    />
  );
}
