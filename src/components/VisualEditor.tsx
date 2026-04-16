import React from 'react';
import { Trash2, Plus } from 'lucide-react';

interface VisualEditorProps {
  data: any;
  onChange: (newData: any) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ data, onChange }) => {
  const renderRecursive = (currentData: any, path: string = ""): React.ReactNode => {
    if (currentData === null || currentData === undefined) return null;

    // Handle Arrays
    if (Array.isArray(currentData)) {
      return (
        <div className="space-y-4 ml-2 border-l-2 border-white/5 pl-4">
          {currentData.map((item, index) => (
            <div key={`${path}[${index}]`} className="relative group">
              <div className="absolute -left-7 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    const newData = [...currentData];
                    newData.splice(index, 1);
                    updateData(path, newData);
                  }}
                  className="p-1 text-red-400 hover:bg-red-400/10 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mb-1">ÍTEM {index + 1}</div>
              {renderRecursive(item, `${path}[${index}]`)}
            </div>
          ))}
          <button
            onClick={() => {
              const newItem = typeof currentData[0] === 'object' && currentData[0] !== null ? {} : "";
              updateData(path, [...currentData, newItem]);
            }}
            className="flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 transition-colors py-2"
          >
            <Plus size={14} /> Añadir Ítem
          </button>
        </div>
      );
    }

    // Handle Objects
    if (typeof currentData === 'object') {
      return (
        <div className="space-y-6">
          {Object.keys(currentData).map((key) => {
            const value = currentData[key];
            const fieldPath = path ? `${path}.${key}` : key;
            const label = key.replace(/_/g, ' ').toUpperCase();

            return (
              <div key={fieldPath} className="space-y-2">
                <label className="text-[10px] font-bold text-teal-400 tracking-widest block">
                  {label}
                </label>
                {typeof value === 'object' && value !== null ? (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    {renderRecursive(value, fieldPath)}
                  </div>
                ) : (
                  <div className="w-full">
                    {typeof value === 'string' && value.length > 60 ? (
                      <textarea
                        value={value}
                        onChange={(e) => updateData(fieldPath, e.target.value)}
                        className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 h-24 resize-none"
                      />
                    ) : (
                      <input
                        value={value ?? ""}
                        onChange={(e) => updateData(fieldPath, e.target.value)}
                        className="w-full bg-teal-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const updateData = (path: string, newValue: any) => {
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = newValue;
    onChange(newData);
  };

  return (
    <div className="visual-editor-container">
      {renderRecursive(data)}
    </div>
  );
};
