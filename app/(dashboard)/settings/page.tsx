import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect to API keys as the default settings page
  redirect('/settings/api-keys')
}