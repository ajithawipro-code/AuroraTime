interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  min?: number;
}

export default function Input({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  required = false,
  min
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-cyan-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        className="w-full px-4 py-3 glass-dark rounded-2xl text-white placeholder-gray-400 border border-white/10 focus:border-cyan-400/50 transition-all duration-300"
      />
    </div>
  );
}
