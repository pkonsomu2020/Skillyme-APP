import { Users, Sparkles } from "lucide-react";

const FindRecruiters = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="relative mb-8 inline-block">
          <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-elegant">
            <Users className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Coming Soon
        </h2>
        
        <p className="text-xl text-muted-foreground mb-2">
          Find Top Recruiters
        </p>
        
        <p className="text-sm text-muted-foreground">
          Connect with recruiters from leading companies across Kenya and beyond. This feature is currently under development.
        </p>
      </div>
    </div>
  );
};

export default FindRecruiters;
