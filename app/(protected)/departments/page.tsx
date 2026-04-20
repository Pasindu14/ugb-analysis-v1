'use client'

import dynamic from 'next/dynamic'

const DepartmentListPage = dynamic(
  () => import('@/features/department/components/pages/department-list-page').then(m => m.DepartmentListPage),
  { ssr: false }
)

export default function Page() {
  return <DepartmentListPage />
}
