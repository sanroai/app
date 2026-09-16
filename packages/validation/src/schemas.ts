import { z } from 'zod';
import {
  Role,
  InstitutionType,
  QuestionType,
  Difficulty,
  AssessmentMode,
  Language,
  ImportEntityType,
} from '@sanro/types';

const emailSchema = z.string().trim().toLowerCase().email('Invalid email');
const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email')
  .optional()
  .or(z.literal('').transform(() => undefined))
  .optional();

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{8,15}$/, 'Invalid phone number')
  .optional();
const emptyToUndefined = z.literal('').transform(() => undefined).optional();

export const RegisterInstitutionSchema = z.object({
  institutionName: z.string().trim().min(2, 'Institution name is required'),
  institutionType: z.enum(Object.values(InstitutionType) as [string, ...string[]]),
  adminName: z.string().trim().min(2, 'Admin name is required'),
  adminEmail: emailSchema,
  adminPhone: phoneSchema,
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: phoneSchema,
  language: z.enum(['EN', 'MR', 'HI']).optional(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
}).partial();

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const CreateInstitutionSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  type: z.enum(Object.values(InstitutionType) as [string, ...string[]]),
  code: z.string().trim().min(2).max(20).optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  primaryPhone: phoneSchema,
  primaryEmail: optionalEmailSchema,
  seatLimit: z.coerce.number().int().positive().optional(),
});

export const UpdateInstitutionSchema = CreateInstitutionSchema.partial();

export const CreateAcademicYearSchema = z.object({
  name: z.string().trim().min(4, 'Academic year name required, e.g. 2026-27'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const CreateGroupSchema = z.object({
  academicYearId: z.string().uuid(),
  name: z.string().trim().min(1, 'Group name is required'),
  type: z.enum(['CLASS', 'DIVISION', 'BATCH']),
  grade: z.string().trim().optional(),
  parentGroupId: z.string().uuid().optional().or(emptyToUndefined),
});

export const UpdateGroupSchema = CreateGroupSchema.partial();

export const CreateStudentSchema = z.object({
  academicYearId: z.string().uuid(),
  name: z.string().trim().min(2, 'Student name is required'),
  email: optionalEmailSchema,
  phone: phoneSchema,
  gender: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  rollNumber: z.string().trim().optional(),
  grade: z.string().trim().optional(),
  groupIds: z.array(z.string().uuid()).default([]),
  parentName: z.string().trim().optional(),
  parentPhone: phoneSchema,
  parentEmail: optionalEmailSchema,
});

export const UpdateStudentSchema = CreateStudentSchema.partial();

export const MoveStudentSchema = z.object({
  fromGroupId: z.string().uuid().optional(),
  toGroupIds: z.array(z.string().uuid()).default([]),
  academicYearId: z.string().uuid(),
});

export const CreateTeacherSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: emailSchema,
  phone: phoneSchema,
  employeeId: z.string().trim().optional(),
  subjectIds: z.array(z.string().uuid()).default([]),
  groupIds: z.array(z.string().uuid()).default([]),
});

export const CreateParentSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: emailSchema,
  phone: phoneSchema,
});

export const importConfigSchema = z.object({
  entityType: z.enum(Object.values(ImportEntityType) as [string, ...string[]]),
  academicYearId: z.string().uuid(),
});

export const CreateQuestionSchema = z.object({
  type: z.enum(Object.values(QuestionType) as [string, ...string[]]),
  boardId: z.string().uuid(),
  grade: z.string().min(1),
  subjectId: z.string().uuid(),
  chapterId: z.string().uuid(),
  topicId: z.string().uuid().optional().or(emptyToUndefined),
  conceptId: z.string().uuid().optional().or(emptyToUndefined),
  difficulty: z.enum(Object.values(Difficulty) as [string, ...string[]]),
  marks: z.coerce.number().int().positive().optional(),
  text: z.string().trim().min(3),
  options: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean() })).optional(),
  answer: z.string().min(1),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  language: z.enum(Object.values(Language) as [string, ...string[]]).default(Language.EN),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

export const ReviewQuestionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'ARCHIVE']),
});

export const CreatePaperSchema = z.object({
  title: z.string().min(1),
  examName: z.string().min(1),
  boardId: z.string().uuid(),
  grade: z.string().min(1),
  subjectId: z.string().uuid(),
  chapterIds: z.array(z.string().uuid()).default([]),
  topicIds: z.array(z.string().uuid()).default([]),
  conceptIds: z.array(z.string().uuid()).default([]),
  totalMarks: z.coerce.number().int().positive().default(50),
  durationMinutes: z.coerce.number().int().positive().default(120),
  date: z.string().optional(),
  instructions: z.string().optional(),
  language: z.enum(Object.values(Language) as [string, ...string[]]).default(Language.EN),
  difficulty: z.enum(Object.values(Difficulty) as [string, ...string[]]).default(Difficulty.MEDIUM),
  distribution: z.record(z.string(), z.object({ count: z.number().int().positive(), marks: z.number().int().positive() })),
  autoGenerateWithAI: z.boolean().default(false),
  versions: z.coerce.number().int().min(1).max(4).default(1),
});

export const RegeneratePaperQuestionsSchema = z.object({
  questionPaperId: z.string().uuid().optional(),
  sectionOrder: z.number().int().optional(),
  questionId: z.string().uuid(),
  regenerate: z.enum(['AI', 'BANK_REPLACE']).optional(),
});

export const ExportPaperSchema = z.object({
  questionPaperId: z.string().uuid(),
  kind: z.enum(['STUDENT', 'ANSWER_KEY']),
  includeLogo: z.boolean().default(true),
});

export const CreateAssessmentSchema = z.object({
  title: z.string().min(1),
  subjectId: z.string().uuid().optional().or(emptyToUndefined),
  chapterId: z.string().uuid().optional().or(emptyToUndefined),
  totalMarks: z.coerce.number().int().positive().default(25),
  durationMinutes: z.coerce.number().int().positive().default(40),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  mode: z.enum(Object.values(AssessmentMode) as [string, ...string[]]).default(AssessmentMode.DIGITAL),
  attemptsAllowed: z.coerce.number().int().positive().default(2),
  dueAt: z.string().optional(),
  startsAt: z.string().optional(),
  autoSubmitOnExpiry: z.boolean().default(true),
  sourcePaperId: z.string().uuid().optional().or(emptyToUndefined),
  questionIds: z.array(z.string().uuid()).optional(),
});

export const AssignAssessmentSchema = z.object({
  assessmentId: z.string().uuid(),
  groupIds: z.array(z.string().uuid()).default([]),
  studentIds: z.array(z.string().uuid()).default([]),
});

export const SubmitAnswerBatchSchema = z.object({
  answers: z.array(
    z.object({
      snapshotQuestionId: z.string().uuid(),
      answer: z.string().max(20000).default(''),
    }),
  ),
});

export const UpdateRemediationItemSchema = z.object({
  status: z.enum(['COMPLETED', 'SKIPPED']),
});

export const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z
    .object({
      conceptId: z.string().uuid().optional(),
      questionId: z.string().uuid().optional(),
      assessmentId: z.string().uuid().optional(),
    })
    .optional(),
});

export const CreateSupportTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

export const ChangeSchoolStudentGroupSchema = z.object({
  studentId: z.string().uuid(),
  groupId: z.string().uuid(),
  action: z.enum(['JOIN', 'LEAVE', 'TRANSFER']),
});

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const IdsQuerySchema = z.object({
  ids: z.string().min(1),
  academicYearId: z.string().uuid().optional(),
});

export type RegisterInstitution = z.infer<typeof RegisterInstitutionSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type CreateInstitution = z.infer<typeof CreateInstitutionSchema>;
export type CreateGroup = z.infer<typeof CreateGroupSchema>;
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type CreateQuestion = z.infer<typeof CreateQuestionSchema>;
export type CreatePaper = z.infer<typeof CreatePaperSchema>;
export type CreateAssessment = z.infer<typeof CreateAssessmentSchema>;