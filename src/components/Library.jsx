import React, { useState } from 'react'
import { Card, CardContent } from './ui/card.jsx'
import { FileText, ArrowLeft, Trophy, Microscope, Dna, Stethoscope, Snowflake, ShieldPlus, ClipboardList } from 'lucide-react'
import { Button } from './ui/button.jsx'

const FOLDERS = [
  {
    name: 'Out of the League', icon: Trophy,
    books: [
      { file: 'cardiology.pdf', label: 'Cardiology' },
      { file: 'contraception.pdf', label: 'Contraception' },
      { file: 'dermatology.pdf', label: 'Dermatology' },
      { file: 'endocrinology.pdf', label: 'Endocrinology' },
      { file: 'ent.pdf', label: 'ENT' },
      { file: 'gastroenterology.pdf', label: 'Gastroenterology' },
      { file: 'gynecology.pdf', label: 'Gynecology' },
      { file: 'hematology.pdf', label: 'Hematology' },
      { file: 'infectious.pdf', label: 'Infectious Diseases' },
      { file: 'nephrology.pdf', label: 'Nephrology' },
      { file: 'neurology.pdf', label: 'Neurology' },
      { file: 'obstetrics.pdf', label: 'Obstetrics' },
      { file: 'ophthalmology.pdf', label: 'Ophthalmology' },
      { file: 'orthopedics.pdf', label: 'Ortho & Rheumatology' },
      { file: 'pediatrics.pdf', label: 'Pediatrics' },
      { file: 'psychiatry.pdf', label: 'Psychiatry' },
      { file: 'respiratory.pdf', label: 'Respiratory' },
      { file: 'surgery.pdf', label: 'Surgery & Male Health' },
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
    name: 'Genetics', icon: Dna,
    books: [
      { file: 'nbs-maro.pdf', label: 'NBS MARO' },
      { file: 'nbs-manual.pdf', label: 'NBS Manual' },
    ],
  },
  {
    name: 'Physical Examination', icon: Stethoscope,
    books: [
      { file: 'thyroid-examination.pdf', label: 'Thyroid Status Examination OSCE' },
      { file: 'abdominal-examination.pdf', label: 'Abdominal Examination OSCE' },
    ],
  },
  {
    name: 'Winter Illnesses', icon: Snowflake,
    books: [
      { file: 'winter-illnesses.pdf', label: 'Winter Illnesses (Full)' },
      { file: 'acute-bronchiolitis.pdf', label: 'Acute Bronchiolitis' },
      { file: 'pertussis.pdf', label: 'Pertussis' },
      { file: 'croup.pdf', label: 'Croup' },
      { file: 'pneumonia.pdf', label: 'Pneumonia' },
    ],
  },
  {
    name: 'Guidelines Management', icon: ClipboardList,
    books: [
      { file: 'chronic-diseases.pdf', label: 'Chronic Diseases' },
      { file: 'emergency-guidelines.pdf', label: 'Emergency Guidelines' },
      { file: 'mental-health-screening.pdf', label: 'Mental Health Screening' },
      { file: 'cough-acute.pdf', label: 'Cough (Acute)' },
      { file: 'sore-throat-acute.pdf', label: 'Sore Throat (Acute)' },
    ],
  },
  {
    name: 'ER Guidelines', icon: ShieldPlus,
    books: [
      { file: 'page-01.pdf', label: 'The ABCDE Approach' },
      { file: 'page-02.pdf', label: 'Acute Left Ventricular Failure' },
      { file: 'page-03.pdf', label: 'Anaphylaxis' },
      { file: 'page-04.pdf', label: 'Asthma (Acute)' },
      { file: 'page-05.pdf', label: 'Burns' },
      { file: 'page-06.pdf', label: 'Convulsions' },
      { file: 'page-07.pdf', label: 'Croup' },
      { file: 'page-08.pdf', label: 'Foreign Body (Throat & Airway)' },
      { file: 'page-09.pdf', label: 'Hyperglycaemia' },
      { file: 'page-10.pdf', label: 'Hypertension' },
      { file: 'page-11.pdf', label: 'Hypoglycaemia (Adults)' },
      { file: 'page-12.pdf', label: 'Loss of Consciousness' },
      { file: 'page-13.pdf', label: 'Myocardial Infarction' },
      { file: 'page-14.pdf', label: 'Open Wound / Trauma' },
      { file: 'page-15.pdf', label: 'Drowning' },
      { file: 'page-16.pdf', label: 'Poisoning' },
      { file: 'page-17.pdf', label: 'Stroke / TIA' },
      { file: 'page-18.pdf', label: 'Head Trauma & Fractures' },
      { file: 'page-19.pdf', label: 'Adult BLS Algorithm' },
      { file: 'page-20.pdf', label: 'Adult Cardiac Arrest Algorithm' },
      { file: 'page-21.pdf', label: 'Adult Bradycardia Algorithm' },
      { file: 'page-22.pdf', label: 'Adult Tachycardia Algorithm' },
    ],
  },
]

export default function Library({ theme }) {
  const [openFolder, setOpenFolder] = useState(null)

  // Inside a folder — show PDFs
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {openFolder.books.map((book) => (
            <Card
              key={book.file}
              className="cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md"
              style={{ borderColor: theme.border, backgroundColor: theme.bg + '80' }}
              onClick={() => window.open(`/library/${book.file}`, '_blank')}
            >
              <CardContent className="flex flex-col items-center gap-2 py-5 px-3 text-center">
                <FileText className="h-10 w-10" style={{ color: theme.text }} />
                <span className="text-sm font-medium leading-tight" style={{ color: theme.text }}>
                  {book.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
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
          style={{ borderColor: theme.border, backgroundColor: theme.bg + '80' }}
          onClick={() => setOpenFolder(folder)}
        >
          <CardContent className="flex flex-col items-center gap-2 py-5 px-3 text-center">
            <Icon className="h-10 w-10" style={{ color: theme.text }} />
            <span className="text-sm font-medium leading-tight" style={{ color: theme.text }}>
              {folder.name}
            </span>
            <span className="text-[10px] text-muted-foreground">{folder.books.length} files</span>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}
