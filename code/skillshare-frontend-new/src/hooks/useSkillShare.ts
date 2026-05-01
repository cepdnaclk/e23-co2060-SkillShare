import { useState } from "react";

export interface StudentProfile {
  id: string;
  name: string;
  university: string;
  major: string;
  avatar: string;
  skills: string[];
  bio: string;
  timeSlots: TimeSlot[];
  location?: string;
  shareLocation: boolean;
}

export interface TimeSlot {
  day: string;
  startHour: number;
  endHour: number;
}

export interface Match {
  student: StudentProfile;
  commonSkills: string[];
  commonSlots: TimeSlot[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8AM to 9PM

const MOCK_STUDENTS: StudentProfile[] = [
  {
    id: "1",
    name: "Sarah Chen",
    university: "MIT",
    major: "Computer Science",
    avatar: "SC",
    skills: ["Python", "Machine Learning", "Data Science", "React"],
    bio: "CS junior passionate about AI and web dev.",
    timeSlots: [
      { day: "Monday", startHour: 10, endHour: 12 },
      { day: "Wednesday", startHour: 14, endHour: 16 },
      { day: "Friday", startHour: 9, endHour: 11 },
    ],
    location: "Campus Library, Room 204",
    shareLocation: true,
  },
  {
    id: "2",
    name: "James Wilson",
    university: "Stanford",
    major: "Design",
    avatar: "JW",
    skills: ["Figma", "UI/UX", "React", "JavaScript"],
    bio: "Design student who loves building interfaces.",
    timeSlots: [
      { day: "Monday", startHour: 9, endHour: 11 },
      { day: "Tuesday", startHour: 13, endHour: 15 },
      { day: "Thursday", startHour: 10, endHour: 12 },
    ],
    location: "Design Studio, Building C",
    shareLocation: true,
  },
  {
    id: "3",
    name: "Aisha Patel",
    university: "MIT",
    major: "Mathematics",
    avatar: "AP",
    skills: ["Python", "Statistics", "Data Science", "R"],
    bio: "Math enthusiast exploring data science applications.",
    timeSlots: [
      { day: "Monday", startHour: 11, endHour: 13 },
      { day: "Wednesday", startHour: 14, endHour: 17 },
      { day: "Friday", startHour: 10, endHour: 12 },
    ],
    shareLocation: false,
  },
  {
    id: "4",
    name: "Marcus Lee",
    university: "Stanford",
    major: "Engineering",
    avatar: "ML",
    skills: ["JavaScript", "React", "Node.js", "TypeScript"],
    bio: "Full-stack developer and open source contributor.",
    timeSlots: [
      { day: "Tuesday", startHour: 10, endHour: 12 },
      { day: "Wednesday", startHour: 15, endHour: 17 },
      { day: "Friday", startHour: 9, endHour: 11 },
    ],
    location: "Engineering Lab 3B",
    shareLocation: true,
  },
];

function findOverlap(a: TimeSlot, b: TimeSlot): TimeSlot | null {
  if (a.day !== b.day) return null;
  const start = Math.max(a.startHour, b.startHour);
  const end = Math.min(a.endHour, b.endHour);
  if (start < end) return { day: a.day, startHour: start, endHour: end };
  return null;
}

export function useSkillShare() {
  const [profile, setProfile] = useState<StudentProfile>({
    id: "me",
    name: "",
    university: "",
    major: "",
    avatar: "",
    skills: [],
    bio: "",
    timeSlots: [],
    shareLocation: false,
  });

  const [students] = useState<StudentProfile[]>(MOCK_STUDENTS);

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !profile.skills.includes(skill.trim())) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
    }
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const addTimeSlot = (slot: TimeSlot) => {
    setProfile((prev) => ({ ...prev, timeSlots: [...prev.timeSlots, slot] }));
  };

  const removeTimeSlot = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const findMatches = (): Match[] => {
    if (profile.skills.length === 0 || profile.timeSlots.length === 0) return [];

    return students
      .map((student) => {
        const commonSkills = student.skills.filter((s) => profile.skills.includes(s));
        const commonSlots: TimeSlot[] = [];

        for (const mySlot of profile.timeSlots) {
          for (const theirSlot of student.timeSlots) {
            const overlap = findOverlap(mySlot, theirSlot);
            if (overlap) commonSlots.push(overlap);
          }
        }

        return { student, commonSkills, commonSlots };
      })
      .filter((m) => m.commonSkills.length > 0 && m.commonSlots.length > 0)
      .sort((a, b) => b.commonSkills.length + b.commonSlots.length - (a.commonSkills.length + a.commonSlots.length));
  };

  return {
    profile,
    updateProfile,
    addSkill,
    removeSkill,
    addTimeSlot,
    removeTimeSlot,
    findMatches,
    students,
    DAYS,
    HOURS,
  };
}
