'use client'

import dynamic from 'next/dynamic'

const UserListPage = dynamic(
  () => import('@/features/users/components/pages/users-list-page').then(m => m.UserListPage),
  { ssr: false }
)

export default function Page() {
  return <UserListPage />
}
