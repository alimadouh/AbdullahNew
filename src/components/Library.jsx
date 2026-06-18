import React, { useState } from 'react'
import { Card, CardContent } from './ui/card.jsx'
import { FileText, ArrowLeft, Trophy, Microscope, Dna, Stethoscope, Snowflake, ShieldPlus, ClipboardList, GraduationCap, Baby } from 'lucide-react'
import { Button } from './ui/button.jsx'

const FOLDERS = [
  {
    name: 'Out of the League', icon: Trophy,
    groups: [
      {
        name: 'Medicine',
        books: [
          { file: 'cardiology.pdf', label: 'Cardiology' },
          { file: 'respiratory.pdf', label: 'Respiratory' },
          { file: 'gastroenterology.pdf', label: 'Gastroenterology' },
          { file: 'endocrinology.pdf', label: 'Endocrinology' },
          { file: 'nephrology.pdf', label: 'Nephrology' },
          { file: 'neurology.pdf', label: 'Neurology' },
          { file: 'hematology.pdf', label: 'Hematology' },
          { file: 'infectious.pdf', label: 'Infectious Diseases' },
          { file: 'psychiatry.pdf', label: 'Psychiatry' },
        ],
      },
      {
        name: 'Surgery & Specialties',
        books: [
          { file: 'surgery.pdf', label: 'Surgery & Male Health' },
          { file: 'orthopedics.pdf', label: 'Ortho & Rheumatology' },
          { file: 'ent.pdf', label: 'ENT' },
          { file: 'ophthalmology.pdf', label: 'Ophthalmology' },
          { file: 'dermatology.pdf', label: 'Dermatology' },
        ],
      },
      {
        name: 'Women & Children',
        books: [
          { file: 'obstetrics.pdf', label: 'Obstetrics' },
          { file: 'gynecology.pdf', label: 'Gynecology' },
          { file: 'contraception.pdf', label: 'Contraception' },
          { file: 'pediatrics.pdf', label: 'Pediatrics' },
        ],
      },
    ],
  },
  {
    name: 'Guidelines Management', icon: ClipboardList,
    groups: [
      {
        name: 'Chronic Disease Protocols (2026)',
        books: [
          { file: 'hypertension.pdf', label: 'Hypertension' },
          { file: 'diabetes.pdf', label: 'Diabetes' },
          { file: 'dyslipidemia.pdf', label: 'Dyslipidemia' },
          { file: 'asthma.pdf', label: 'Asthma' },
          { file: 'copd.pdf', label: 'COPD' },
          { file: 'osteoporosis.pdf', label: 'Osteoporosis' },
          { file: 'spirometer-protocol.pdf', label: 'Spirometer Protocol' },
        ],
      },
      {
        name: 'Chronic & Screening',
        books: [
          { file: 'chronic-diseases.pdf', label: 'Chronic Diseases' },
          { file: 'mental-health-screening.pdf', label: 'Mental Health Screening' },
        ],
      },
      {
        name: 'Acute Presentations',
        books: [
          { file: 'cough-acute.pdf', label: 'Cough (Acute)' },
          { file: 'sore-throat-acute.pdf', label: 'Sore Throat (Acute)' },
        ],
      },
    ],
  },
  {
    name: 'ER Guidelines', icon: ShieldPlus,
    groups: [
      {
        name: 'Full Document',
        books: [
          { file: 'emergencies-primary-healthcare.pdf', label: 'Emergencies in Primary Healthcare (June 2026)' },
        ],
      },
      {
        name: 'Approach & Adult Resuscitation',
        books: [
          { file: 'page-01.pdf', label: 'The ABCDE Approach' },
          { file: 'page-21.pdf', label: 'Adult BLS Algorithm' },
          { file: 'page-22.pdf', label: 'Adult Cardiac Arrest Algorithm' },
          { file: 'page-23.pdf', label: 'Adult Bradycardia Algorithm' },
          { file: 'page-24.pdf', label: 'Adult Tachycardia Algorithm' },
        ],
      },
      {
        name: 'Medical Emergencies',
        books: [
          { file: 'page-13.pdf', label: 'Myocardial Infarction' },
          { file: 'page-02.pdf', label: 'Acute Left Ventricular Failure' },
          { file: 'page-19.pdf', label: 'Stroke / TIA' },
          { file: 'page-03.pdf', label: 'Anaphylaxis' },
          { file: 'page-04.pdf', label: 'Asthma (Acute)' },
          { file: 'page-06.pdf', label: 'Convulsions' },
          { file: 'page-12.pdf', label: 'Loss of Consciousness' },
          { file: 'page-09.pdf', label: 'Hyperglycaemia' },
          { file: 'page-11.pdf', label: 'Hypoglycaemia (Adults)' },
          { file: 'page-10.pdf', label: 'Hypertension' },
          { file: 'page-18.pdf', label: 'Poisoning' },
          { file: 'page-07.pdf', label: 'Croup' },
        ],
      },
      {
        name: 'Trauma & Environmental',
        books: [
          { file: 'page-05.pdf', label: 'Burns' },
          { file: 'page-14.pdf', label: 'Open Wound / Trauma' },
          { file: 'page-20.pdf', label: 'Head Trauma & Fractures' },
          { file: 'page-08.pdf', label: 'Foreign Body (Throat & Airway)' },
          { file: 'page-15.pdf', label: 'Drowning' },
        ],
      },
      {
        name: 'Choking & Airway Obstruction',
        books: [
          { file: 'page-25.pdf', label: 'Adult Foreign Body Airway Obstruction' },
          { file: 'page-17.pdf', label: 'Child Choking' },
          { file: 'page-29.pdf', label: 'Child Foreign Body Airway Obstruction' },
          { file: 'page-16.pdf', label: 'Infant Choking' },
          { file: 'page-30.pdf', label: 'Infant Foreign Body Airway Obstruction' },
        ],
      },
      {
        name: 'Pediatric & Neonatal Resuscitation',
        books: [
          { file: 'page-26.pdf', label: 'Pediatric BLS Algorithm' },
          { file: 'page-27.pdf', label: 'Pediatric Cardiac Arrest Algorithm' },
          { file: 'page-28.pdf', label: 'Neonatal Resuscitation Algorithm' },
        ],
      },
    ],
  },
  {
    name: 'Physical Examination', icon: Stethoscope,
    groups: [
      {
        name: 'Reference',
        books: [
          { file: 'macleods-clinical-examination.pdf', label: "Macleod's Clinical Examination" },
        ],
      },
      {
        name: 'OSCE Stations',
        books: [
          { file: 'thyroid-examination.pdf', label: 'Thyroid Status Examination OSCE' },
          { file: 'abdominal-examination.pdf', label: 'Abdominal Examination OSCE' },
        ],
      },
    ],
  },
  {
    name: 'Pediatrics', icon: Baby,
    groups: [
      {
        name: 'Doses & Development',
        books: [
          { file: '/pediatrics/peds-doses.pdf', label: 'Pediatric Doses' },
          { file: '/pediatrics/growth-indication.pdf', label: 'Growth Indicator' },
          { file: '/pediatrics/developmental-milestones.pdf', label: 'Developmental Milestones' },
        ],
      },
      {
        name: 'Growth Charts',
        books: [
          { file: '/pediatrics/boy-birth-2.pdf', label: 'Boy (Birth - 2 years)' },
          { file: '/pediatrics/boy-2-5.pdf', label: 'Boy (2 - 5 years)' },
          { file: '/pediatrics/boy-5-19.pdf', label: 'Boy (5 - 19 years)' },
          { file: '/pediatrics/girl-birth-2.pdf', label: 'Girl (Birth - 2 years)' },
          { file: '/pediatrics/girl-2-5.pdf', label: 'Girl (2 - 5 years)' },
          { file: '/pediatrics/girl-5-19.pdf', label: 'Girl (5 - 19 years)' },
        ],
      },
      {
        name: 'Winter Illnesses',
        books: [
          { file: 'winter-illnesses.pdf', label: 'Winter Illnesses (Full)' },
          { file: 'acute-bronchiolitis.pdf', label: 'Acute Bronchiolitis' },
          { file: 'pertussis.pdf', label: 'Pertussis' },
          { file: 'croup.pdf', label: 'Croup' },
          { file: 'pneumonia.pdf', label: 'Pneumonia' },
        ],
      },
    ],
  },
  {
    name: 'Genetics', icon: Dna,
    books: [
      { file: 'nbs-maro.pdf', label: 'NBS MARO' },
      { file: 'nbs-manual.pdf', label: 'NBS Manual' },
    ],
  },
  {
    name: 'Dermatology', icon: Microscope,
    books: [
      { file: 'skin-lesion-guide.pdf', label: 'Skin Lesion Guide' },
      { file: 'dermatological-cases.pdf', label: 'Dermatological Cases' },
    ],
  },
  {
    name: 'Exams', icon: GraduationCap,
    groups: [
      {
        name: 'Clinical Specialties',
        books: [
          { file: 'internal-medicine-exam.pdf', label: 'Internal Medicine' },
          { file: 'ob-gyn-exam.pdf', label: 'Ob-Gyn' },
          { file: 'pediatric-exam.pdf', label: 'Pediatric' },
          { file: 'surgery-exam.pdf', label: 'Surgery' },
        ],
      },
      {
        name: 'Professional',
        books: [
          { file: 'ethics-exam.pdf', label: 'Ethics' },
        ],
      },
    ],
  },
]

export default function Library({ theme, dark }) {
  const [openFolder, setOpenFolder] = useState(null)
  const cardStyle = dark
    ? { borderColor: theme.text + '55', background: 'linear-gradient(150deg, oklch(0.255 0.014 256), oklch(0.225 0.016 256))' }
    : { borderColor: theme.border, backgroundColor: theme.bg + '80' }
  // In-card label text: light/near-white in dark (readable), brand accent in light
  const labelColor = dark ? '#e8edf4' : theme.text

  const folderCount = (folder) => folder.groups
    ? folder.groups.reduce((n, g) => n + g.books.length, 0)
    : folder.books.length

  const renderBook = (book) => (
    <Card
      key={book.file}
      className="cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md"
      style={cardStyle}
      onClick={() => window.open(book.file.startsWith('/') ? book.file : `/library/${book.file}`, '_blank')}
    >
      <CardContent className="flex flex-col items-center gap-2 py-5 px-3 text-center">
        <FileText className="h-10 w-10" style={{ color: theme.text }} />
        <span className="text-sm font-medium leading-tight" style={{ color: labelColor }}>
          {book.label}
        </span>
      </CardContent>
    </Card>
  )

  const bookGrid = (books) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {books.map(renderBook)}
    </div>
  )

  // Inside a folder — show PDFs (grouped into sub-sections when defined)
  if (openFolder) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenFolder(null)}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
          <span className="font-semibold text-sm" style={{ color: theme.text }}>{openFolder.name}</span>
        </div>
        {openFolder.groups ? (
          <div className="flex flex-col gap-6">
            {openFolder.groups.map((group) => (
              <div key={group.name}>
                {/* Sub-section header + divider line */}
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.text }}>{group.name}</span>
                  <span className="h-px flex-1 rounded-full" style={{ backgroundColor: theme.text + '33' }} />
                  <span className="text-[10px] text-muted-foreground">{group.books.length} files</span>
                </div>
                {bookGrid(group.books)}
              </div>
            ))}
          </div>
        ) : (
          bookGrid(openFolder.books)
        )}
      </div>
    )
  }

  // Root — show folders
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {FOLDERS.map((folder) => {
        const Icon = folder.icon
        return (
        <Card
          key={folder.name}
          className="cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md"
          style={cardStyle}
          onClick={() => setOpenFolder(folder)}
        >
          <CardContent className="flex flex-col items-center gap-2 py-5 px-3 text-center">
            <Icon className="h-10 w-10" style={{ color: theme.text }} />
            <span className="text-sm font-medium leading-tight" style={{ color: labelColor }}>
              {folder.name}
            </span>
            <span className="text-[10px] text-muted-foreground">{folderCount(folder)} files</span>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}
