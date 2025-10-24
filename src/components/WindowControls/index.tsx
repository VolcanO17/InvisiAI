import { GripVertical } from "lucide-react";

const WindowControls = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Drag Indicator Icon */}
      <div className="p-3 hover:bg-accent/50 rounded-md cursor-move select-none">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
};

export default WindowControls;