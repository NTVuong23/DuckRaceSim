import React, { ChangeEvent, useState, useRef, KeyboardEvent } from "react";
import { toast } from "sonner";
import { Duck, useDuckRace } from "@/lib/stores/useDuckRace";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Save, Crown, List, Upload, Check, Palette } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DuckForm = () => {
  const { 
    ducks, 
    raceDuration, 
    predeterminedWinnerId,
    raceStatus,
    addDuck, 
    removeDuck, 
    updateDuck,
    updateDuckColor, 
    updateRaceDuration,
    setPredeterminedWinner
  } = useDuckRace();
  
  const [tempDuration, setTempDuration] = useState(raceDuration.toString());
  const [bulkNames, setBulkNames] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  
  // Handle name change for an individual duck
  const handleNameChange = (id: number, name: string) => {
    updateDuck(id, { name });
  };
  
  // Handle keyboard events for auto-creating ducks on Enter
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    // If Enter is pressed on the last duck, automatically add a new duck
    if (event.key === 'Enter' && index === ducks.length - 1 && ducks.length < 100) {
      event.preventDefault(); // Prevent form submission
      addDuck();
    }
  };
  
  const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTempDuration(e.target.value);
  };
  
  const saveDuration = () => {
    const duration = parseInt(tempDuration);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      toast.error("Thời gian đua phải từ 1 đến 60 giây");
      setTempDuration(raceDuration.toString());
      return;
    }
    updateRaceDuration(duration);
    toast.success(`Đã đặt thời gian đua thành ${duration} giây`);
  };
  
  const handleWinnerChange = (value: string) => {
    const id = value === "none" ? null : parseInt(value);
    setPredeterminedWinner(id);
    
    if (id === null) {
      toast.info("Kết quả đua sẽ ngẫu nhiên");
    } else {
      const winner = ducks.find(d => d.id === id);
      if (winner) {
        toast.success(`${winner.name} sẽ thắng cuộc đua`);
      }
    }
  };
  
  // Bulk import duck names
  const handleBulkNamesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBulkNames(e.target.value);
  };
  
  const processBulkNames = () => {
    if (!bulkNames.trim()) {
      toast.error("Hãy nhập một số tên");
      return;
    }
    
    // Split by newlines and filter out empty lines
    const names = bulkNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (names.length === 0) {
      toast.error("Không tìm thấy tên hợp lệ");
      return;
    }
    
    // Limit to 100 names
    const validNames = names.slice(0, 100);
    
    // Store the current duck IDs to update them instead of removing/adding
    const currentDuckIds = [...ducks].map(duck => duck.id);
    
    // Update existing ducks
    for (let i = 0; i < Math.min(currentDuckIds.length, validNames.length); i++) {
      updateDuck(currentDuckIds[i], { name: validNames[i] });
    }
    
    // Add new ducks if needed
    if (validNames.length > currentDuckIds.length) {
      for (let i = currentDuckIds.length; i < validNames.length; i++) {
        // Add a new duck
        addDuck();
        // Get the latest duck array after adding
        const updatedDucks = useDuckRace.getState().ducks;
        // Update the name of the last added duck
        if (updatedDucks.length > 0) {
          const lastDuck = updatedDucks[updatedDucks.length - 1];
          updateDuck(lastDuck.id, { name: validNames[i] });
        }
      }
    }
    
    // Remove extra ducks if we have more than names
    if (currentDuckIds.length > validNames.length && validNames.length > 0) {
      // Keep only the number of ducks we have names for
      for (let i = currentDuckIds.length - 1; i >= validNames.length; i--) {
        removeDuck(currentDuckIds[i]);
      }
    }
    
    // Close the dialog and show success message
    setShowBulkInput(false);
    toast.success(`Đã nhập ${validNames.length} tên vịt`);
    setBulkNames('');
  };
  
  // Cannot modify settings during race
  const isLocked = raceStatus !== "idle";
  
  return (
    <Card className="w-full mb-4 bg-white shadow-xl rounded-xl overflow-hidden border-0">
      <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-3">
        <CardTitle className="text-2xl font-bold text-center text-slate-800">Cài Đặt Cuộc Đua</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-700">Những Con Vịt Đua ({ducks.length}/100)</h3>
              <div className="flex gap-2">
                <Dialog open={showBulkInput} onOpenChange={setShowBulkInput}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={isLocked}
                      className="rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md transform transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <List size={16} className="mr-1" /> Nhập Hàng Loạt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" aria-describedby="bulk-duck-names-desc">
                    <DialogHeader>
                      <DialogTitle>Nhập Hàng Loạt Tên Vịt</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                      <p className="text-sm text-gray-500" id="bulk-duck-names-desc">
                        Nhập mỗi tên vịt trên một dòng. Tối đa 100 con vịt.
                      </p>
                      <Textarea
                        placeholder="Nhập tên vịt, mỗi tên một dòng:
Vịt Vàng
Vịt Donald
Scrooge
Huey
Dewey
Louie"
                        value={bulkNames}
                        onChange={handleBulkNamesChange}
                        className="min-h-[150px]"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Hủy Bỏ</Button>
                      </DialogClose>
                      <Button 
                        onClick={processBulkNames} 
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check size={16} className="mr-1" /> Nhập Tên
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  onClick={addDuck} 
                  disabled={ducks.length >= 100 || isLocked}
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md transform transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Plus size={16} className="mr-1" /> Thêm Vịt
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {ducks.map((duck: Duck, index: number) => (
                <div 
                  key={duck.id} 
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={duck.color}
                      onChange={(e) => updateDuckColor(duck.id, e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0 mr-1"
                      title="Chọn màu vịt"
                      disabled={isLocked}
                    />
                    <div 
                      className="w-6 h-6 rounded-full shadow-inner border border-gray-200" 
                      style={{ backgroundColor: duck.color }}
                    />
                  </div>
                  <Input
                    value={duck.name}
                    onChange={(e) => handleNameChange(duck.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="flex-1 border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 rounded-lg"
                    maxLength={20}
                    disabled={isLocked}
                    placeholder={`Vịt ${index + 1}`}
                  />
                  {predeterminedWinnerId === duck.id && (
                    <div className="text-yellow-500 tooltip" data-tip="Sẽ thắng cuộc đua">
                      <Crown size={18} />
                    </div>
                  )}
                  {ducks.length > 1 && (
                    <Button 
                      onClick={() => removeDuck(duck.id)} 
                      variant="outline"
                      size="sm"
                      className="rounded-full border-red-200 hover:bg-red-500 hover:text-white"
                      disabled={isLocked}
                    >
                      <Minus size={16} />
                    </Button>
                  )}
                </div>
              ))}
              {ducks.length === 0 && (
                <div className="text-center p-4 text-gray-500">
                  Chưa có vịt nào. Hãy thêm vài con vịt để bắt đầu cuộc đua!
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <Label htmlFor="race-duration" className="font-bold text-slate-700">
                Thời Gian Đua (giây)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="race-duration"
                  type="number"
                  min={1}
                  max={60}
                  value={tempDuration}
                  onChange={handleDurationChange}
                  className="border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 rounded-lg"
                  disabled={isLocked}
                />
                <Button 
                  onClick={saveDuration} 
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-bold rounded-lg shadow-md transform transition-all duration-200 hover:scale-105 active:scale-95"
                  disabled={isLocked}
                >
                  <Save size={16} className="mr-1" /> Đặt
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Thời gian từ 1-60 giây
              </p>
            </div>
            
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <Label htmlFor="predetermined-winner" className="font-bold text-slate-700 flex items-center">
                <Crown size={16} className="mr-1 text-yellow-500" /> Vịt Sẽ Thắng
              </Label>
              <Select 
                value={predeterminedWinnerId ? predeterminedWinnerId.toString() : "none"}
                onValueChange={handleWinnerChange}
                disabled={isLocked}
              >
                <SelectTrigger 
                  id="predetermined-winner" 
                  className="border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 rounded-lg"
                >
                  <SelectValue placeholder="Chọn một vịt thắng" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="none">Kết quả ngẫu nhiên</SelectItem>
                  {ducks.map((duck) => (
                    <SelectItem 
                      key={`select-winner-${duck.id}`} 
                      value={duck.id.toString()}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: duck.color }}
                        />
                        {duck.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Bí mật chọn con vịt nào sẽ thắng cuộc đua
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DuckForm;
