import {
  ALargeSmall, ArrowDownUp, ArrowLeftRight, Binary, Braces, Calculator, CalendarDays, CalendarRange,
  CaseSensitive, CircleCheck, Clock, Combine, Contrast, Crop, Dices, FileArchive, FileCode, FileImage,
  FileOutput, FileText, Fingerprint, GitCompareArrows, Hourglass, Image as ImageIcon, Images, KeyRound,
  Link, Link2, ListChecks, ListOrdered, ListX, LockKeyhole, Minimize2, Palette, Percent, Pilcrow, Receipt,
  RefreshCw, RotateCw, Ruler, Scale, Scaling, Shrink, Shuffle, Sigma, Space, Split, Timer, Type, Unlink,
  UserRound, WholeWord, Wrench, Zap, type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  ALargeSmall, ArrowDownUp, ArrowLeftRight, Binary, Braces, Calculator, CalendarDays, CalendarRange,
  CaseSensitive, CircleCheck, Clock, Combine, Contrast, Crop, Dices, FileArchive, FileCode, FileImage,
  FileOutput, FileText, Fingerprint, GitCompareArrows, Hourglass, Image: ImageIcon, Images, KeyRound,
  Link, Link2, ListChecks, ListOrdered, ListX, LockKeyhole, Minimize2, Palette, Percent, Pilcrow, Receipt,
  RefreshCw, RotateCw, Ruler, Scale, Scaling, Shrink, Shuffle, Sigma, Space, Split, Timer, Type, Unlink,
  UserRound, WholeWord, Zap,
};

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Wrench;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}
