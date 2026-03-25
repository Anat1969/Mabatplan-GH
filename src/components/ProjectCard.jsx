import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, ArrowLeft } from "lucide-react";
import StatusBadge, { getPlanTypeLabel } from "./StatusBadge";
import CompletionBar from "./CompletionBar";
import moment from "moment";

export default function ProjectCard({ project, completionScore }) {
  return (
    <Link to={`/project/${project.id}/edit`}>
      <Card className="group p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border hover:border-primary/20 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base truncate group-hover:text-primary transition-colors">
              {project.plan_name || "תוכנית ללא שם"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              תוכנית מס׳ {project.plan_number || "—"}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          {(project.block || project.parcel) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              גוש {project.block || "—"} חלקה {project.parcel || "—"}
            </span>
          )}
          {project.plan_type && (
            <span className="bg-muted px-2 py-0.5 rounded-md">
              {getPlanTypeLabel(project.plan_type)}
            </span>
          )}
          {project.created_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {moment(project.created_date).format("DD/MM/YYYY")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <CompletionBar score={completionScore || 0} />
          </div>
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:-translate-x-1 duration-200" />
        </div>
      </Card>
    </Link>
  );
}