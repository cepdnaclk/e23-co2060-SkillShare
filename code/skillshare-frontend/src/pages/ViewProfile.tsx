import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

const MOCK_STUDENTS: Record<string, {
  name: string;
  university: string;
  major: string;
  avatar: string;
  skills: string[];
  bio: string;
  location?: string;
  shareLocation: boolean;
  timeSlots: { day: string; startHour: number; endHour: number }[];
}> = {
  "1": {
    name: "Sarah Chen",
    university: "MIT",
    major: "Computer Science",
    avatar: "SC",
    skills: ["Python", "Machine Learning", "Data Science", "React", "TensorFlow"],
    bio: "CS junior passionate about AI and web development. Currently working on a machine learning project for campus sustainability. Love helping others learn to code!",
    location: "Campus Library, Room 204",
    shareLocation: true,
    timeSlots: [
      { day: "Monday", startHour: 10, endHour: 12 },
      { day: "Wednesday", startHour: 14, endHour: 16 },
      { day: "Friday", startHour: 9, endHour: 11 },
    ],
  },
  "2": {
    name: "James Wilson",
    university: "Stanford",
    major: "Design",
    avatar: "JW",
    skills: ["Figma", "UI/UX", "React", "JavaScript", "Adobe XD", "Prototyping"],
    bio: "Design student who loves building beautiful interfaces. Previously interned at a design agency. Happy to help with UI reviews and design feedback.",
    location: "Design Studio, Building C",
    shareLocation: true,
    timeSlots: [
      { day: "Monday", startHour: 9, endHour: 11 },
      { day: "Tuesday", startHour: 13, endHour: 15 },
    ],
  },
  "3": {
    name: "Aisha Patel",
    university: "MIT",
    major: "Mathematics",
    avatar: "AP",
    skills: ["Python", "Statistics", "Data Science", "R", "Calculus", "Linear Algebra"],
    bio: "Math enthusiast exploring data science applications. I can help with statistics, calculus, and data analysis.",
    shareLocation: false,
    timeSlots: [
      { day: "Monday", startHour: 11, endHour: 13 },
      { day: "Wednesday", startHour: 14, endHour: 17 },
    ],
  },
  "4": {
    name: "Marcus Lee",
    university: "Stanford",
    major: "Engineering",
    avatar: "ML",
    skills: ["JavaScript", "React", "Node.js", "TypeScript", "MongoDB", "Express"],
    bio: "Full-stack developer and open source contributor. Love building web apps and teaching others about modern web development.",
    location: "Engineering Lab 3B",
    shareLocation: true,
    timeSlots: [
      { day: "Tuesday", startHour: 10, endHour: 12 },
      { day: "Wednesday", startHour: 15, endHour: 17 },
    ],
  },
};

const formatHour = (h: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${period}`;
};

const ViewProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const student = id ? MOCK_STUDENTS[id] : null;

  if (!student) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 text-center">
          <p className="text-muted-foreground">Student not found</p>
          <Button onClick={() => navigate("/search")} className="mt-4">
            Back to Search
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-2xl mx-auto mb-4">
            {student.avatar}
          </div>
          <h1 className="text-2xl font-heading font-bold mb-1">{student.name}</h1>
          <p className="text-muted-foreground">{student.major} • {student.university}</p>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="text-muted-foreground">{student.bio}</p>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {student.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1">
                {skill}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Availability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-5 rounded-2xl bg-card border border-border"
        >
          <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
            <Clock className="w-4 h-4 text-primary" /> Available Times
          </h3>
          <div className="space-y-2">
            {student.timeSlots.map((slot, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="font-medium w-24">{slot.day}</span>
                <span className="text-muted-foreground">
                  {formatHour(slot.startHour)} — {formatHour(slot.endHour)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Location */}
        {student.shareLocation && student.location && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8 p-5 rounded-2xl bg-accent/5 border border-accent/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Preferred meeting spot</p>
                <p className="font-medium">{student.location}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Button className="flex-1 py-6 gap-2">
            <MessageCircle className="w-4 h-4" /> Send Message
          </Button>
          <Button variant="outline" className="flex-1 py-6 gap-2">
            <Calendar className="w-4 h-4" /> Schedule Meeting
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ViewProfile;
