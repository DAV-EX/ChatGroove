import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Video, PhoneOff, VideoOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CallControlsProps {
  chatId: string;
  isGroup?: boolean;
  recipientName?: string;
}

export function CallControls({ chatId, isGroup, recipientName }: CallControlsProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const { toast } = useToast();

  const startAudioCall = () => {
    setIsCallActive(true);
    setIsVideoCall(false);
    toast({
      title: "Audio Call Started",
      description: `Calling ${recipientName || 'group'}...`,
    });
  };

  const startVideoCall = () => {
    setIsCallActive(true);
    setIsVideoCall(true);
    toast({
      title: "Video Call Started", 
      description: `Video calling ${recipientName || 'group'}...`,
    });
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsVideoCall(false);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsSpeakerOn(false);
    toast({
      title: "Call Ended",
      description: "The call has been disconnected.",
    });
  };

  if (isCallActive) {
    return (
      <Dialog open={isCallActive}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {isVideoCall ? 'Video Call' : 'Audio Call'} with {recipientName || 'Group'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 p-6">
            {/* Call Status */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                {isVideoCall ? (
                  <Video className="w-10 h-10 text-white" />
                ) : (
                  <Phone className="w-10 h-10 text-white" />
                )}
              </div>
              <p className="text-lg font-semibold">{recipientName || 'Group Call'}</p>
              <p className="text-sm text-gray-500">Connected - 00:45</p>
            </div>

            {/* Video Preview (for video calls) */}
            {isVideoCall && (
              <div className="w-full max-w-sm aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <Video className="w-16 h-16 text-gray-400" />
                <span className="ml-2 text-white">Video Preview</span>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex items-center space-x-4">
              <Button
                size="lg"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full p-4"
                onClick={() => setIsMuted(!isMuted)}
                data-testid="button-toggle-mute"
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              {isVideoCall && (
                <Button
                  size="lg"
                  variant={!isVideoEnabled ? "destructive" : "secondary"}
                  className="rounded-full p-4"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  data-testid="button-toggle-video"
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>
              )}

              <Button
                size="lg"
                variant={isSpeakerOn ? "secondary" : "outline"}
                className="rounded-full p-4"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                data-testid="button-toggle-speaker"
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>

              <Button
                size="lg"
                variant="destructive"
                className="rounded-full p-4 bg-red-500 hover:bg-red-600"
                onClick={endCall}
                data-testid="button-end-call"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="ghost"
        className="rounded-full p-2 hover:bg-green-50 dark:hover:bg-green-950 text-green-600 dark:text-green-400"
        onClick={startAudioCall}
        disabled={isGroup}
        data-testid="button-start-audio-call"
      >
        <Phone className="w-4 h-4" />
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        className="rounded-full p-2 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400"
        onClick={startVideoCall}
        disabled={isGroup}
        data-testid="button-start-video-call"
      >
        <Video className="w-4 h-4" />
      </Button>
    </div>
  );
}