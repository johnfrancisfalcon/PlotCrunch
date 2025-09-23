// lib/jobs.ts
type JobStatus = "queued" | "running" | "error" | "done";

export type JobRecord = {
  id: string;
  status: JobStatus;
  step: string;
  progress: number; // 0..100
  resultUrl?: string;
  log?: string;
};

const jobs = new Map<string, JobRecord>();

export function createJob(id: string): JobRecord {
  const job: JobRecord = { id, status: "queued", step: "Waiting", progress: 0 };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string) {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<JobRecord>) {
  const j = jobs.get(id);
  if (!j) return;
  const updated = { ...j, ...patch };
  jobs.set(id, updated);
  return updated;
}

// Simulated pipeline for local dev. Replace with real steps later.
export function simulatePipeline(id: string) {
  const steps = [
    "Video Upload",
    "AI Transcription",
    "Content Analysis",
    "Scene Selection",
    "AI Voiceover",
    "Video Compilation",
  ];

  let i = 0;
  updateJob(id, { status: "running", step: steps[i], progress: 5 });

  const tick = () => {
    i++;
    if (i < steps.length) {
      updateJob(id, {
        step: steps[i],
        progress: Math.min(5 + Math.floor((i / (steps.length - 1)) * 90), 95),
      });
      setTimeout(tick, 1200);
    } else {
      updateJob(id, {
        status: "done",
        step: "Complete",
        progress: 100,
        resultUrl: "/demo.mp4",
      });
    }
  };

  setTimeout(tick, 1200);
}
