# Recruitment Module - Complete Guide

## 📍 Where Everything Is Located

### 1. **CV Imports & Extraction** (Lines 1-10)
```typescript
import * as pdfjsLib from 'pdfjs-dist';  // PDF parsing
import * as mammoth from 'mammoth';      // DOCX parsing
```
- **PDF extraction**: Lines 140-162 in `handleViewCV()` function
- **DOCX extraction**: Lines 163-168 in `handleViewCV()` function
- Extracts text from candidate CVs for preview

### 2. **CV Filtering** (Lines 90-105)
**Location**: Inside `useEffect(() => { ... })` hook
```typescript
// Filter candidates with resume files (PDF or DOCX)
const filtered = (candidatesData.results || candidatesData).filter(
  (c: Candidate) => c.resume && (c.resume.includes('.pdf') || c.resume.includes('.docx'))
);
```
- Only displays candidates with `.pdf` or `.docx` files
- Hides candidates without CV files
- Backend returns all candidates, frontend filters locally

### 3. **Candidate Information Extraction** (Lines 127-177)
**Function**: `handleViewCV(candidate: Candidate)`
- **PDF Processing**:
  - Fetches CV file from backend
  - Converts to ArrayBuffer
  - Uses `pdfjs-dist` to parse pages
  - Extracts text from each page
  - Stores in `cvContent` property

- **DOCX Processing**:
  - Fetches CV file from backend
  - Converts to ArrayBuffer
  - Uses `mammoth.extractRawText()` to extract text
  - Stores in `cvContent` property

### 4. **Departments in System** (Lines 40-50)
```typescript
const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'Management',
  'Design',
  'Quality Assurance',
  'Customer Support',
];
```
- Used in job posting form dropdown
- Can be extended with more departments

### 5. **Admin Job Posting Features** (Lines 241-329)

#### Create Job (NEW)
- **UI Location**: Lines 421-520
- **Handler**: `handleSaveJob()` (Lines 298-329)
- **Form Fields**:
  - Job Title (required)
  - Department (required) - dropdown with DEPARTMENTS
  - Description (required)
  - Min Salary (optional)
  - Max Salary (optional)
  - Position Type (full_time, part_time, contract, internship)
  - Requirements (optional)
- **API**: `POST /api/recruitment/job-postings/`

#### Edit Job (NEW)
- **Handler**: `handleEditJob(id)` (Lines 241-252)
- **Functionality**:
  - Pre-fills form with existing job data
  - Sets `editingId` to enable PUT request
  - Shows "Edit Job Posting" title
- **API**: `PUT /api/recruitment/job-postings/{id}/`

#### Delete Job (NEW)
- **Handler**: `handleDeleteJob(id)` (Lines 254-273)
- **Functionality**:
  - Confirms before deletion
  - Removes from UI immediately
  - Shows success message
- **API**: `DELETE /api/recruitment/job-postings/{id}/`

### 6. **Job Posting Form UI** (Lines 421-520)
Features:
- ✅ Toggle button: `+ New Job Opening` / `✕ Cancel`
- ✅ Form fields with validation
- ✅ Department dropdown with predefined list
- ✅ Position type selector
- ✅ Salary range inputs
- ✅ Create/Edit/Cancel actions

### 7. **Job Postings Display** (Lines 522-558)
- Shows all job postings
- Edit button (yellow)
- Delete button (red)
- View Applications button (blue)
- Status badge (Open, Closed, On Hold, Draft)

### 8. **Status Filtering** (Lines 395-412)
Filter candidates by status:
- All Statuses
- New
- Screening
- First Interview
- Second Interview
- Final Interview
- Offered
- Hired
- Rejected
- Withdrawn

### 9. **Backend API Integration**
**Base URL**: `http://localhost:8080/api/recruitment/`

**Endpoints Used**:
- `GET /job-postings/` - List all jobs
- `POST /job-postings/` - Create new job
- `PUT /job-postings/{id}/` - Update job
- `DELETE /job-postings/{id}/` - Delete job
- `GET /candidates/` - List all candidates
- `POST /candidates/{id}/update_status/` - Update candidate status

## 📋 Data Flow

```
Admin clicks "New Job Opening"
    ↓
Form appears with department dropdown
    ↓
Admin fills form (title, dept, description, salary, etc.)
    ↓
Click "Create Posting" → POST to backend
    ↓
Job appears in list
    ↓
Admin selects job → Shows filtered applicants with CVs
    ↓
Admin clicks "View CV" → Extract and display CV text
```

## 🔧 Key Functions Reference

| Function | Location | Purpose |
|----------|----------|---------|
| `handleAddNewJob()` | Line 195 | Toggle job form visibility |
| `handleSaveJob()` | Line 298 | Create or update job posting |
| `handleEditJob()` | Line 241 | Load job data into form |
| `handleDeleteJob()` | Line 254 | Delete job posting |
| `handleViewCV()` | Line 127 | Extract and display CV |
| `handleDownloadCV()` | Line 178 | Download CV file |
| `handleViewJob()` | Line 218 | Show applicants for job |
| `handleUpdateCandidateStatus()` | Line 189 | Update candidate status |

## 🎯 Filtering Logic

**CV Filtering** (Backend Response → Frontend Filter):
```typescript
// Only show candidates with PDF or DOCX files
const filtered = candidates.filter(
  (c) => c.resume && (c.resume.includes('.pdf') || c.resume.includes('.docx'))
);
```

**Status Filtering** (Frontend):
```typescript
// Filter by selected status
const filteredCandidates = useMemo(() => {
  if (statusFilter === 'all') {
    return selectedJob ? getApplicantsByJob(selectedJob) : candidates;
  }
  return candidates.filter((c) => c.status === statusFilter);
}, [selectedJob, candidates, statusFilter]);
```

## 📦 Installed Dependencies
- `pdfjs-dist` - PDF text extraction
- `mammoth` - DOCX text extraction

## ✅ Complete Features
- ✅ List job postings
- ✅ Create new job (Admin only)
- ✅ Edit existing job (Admin only)
- ✅ Delete job posting (Admin only)
- ✅ Filter by department
- ✅ Set salary range
- ✅ Filter candidates by status
- ✅ View candidates with CVs (PDF/DOCX only)
- ✅ Extract CV text automatically
- ✅ Download CV files
- ✅ Update candidate status
- ✅ Responsive design
