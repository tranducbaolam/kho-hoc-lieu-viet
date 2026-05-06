import type { Metadata } from 'next'
import { listApiKeys } from '@/features/api-keys/apiKeyService'
import { ApiKeysManager } from './ApiKeysManager'
import { LLMProvidersManager } from '@/components/ai-assistant/LLMProvidersManager'
import { ApiReferenceSection } from '@/components/developer/ApiReferenceSection'
import { requirePermission } from '@/lib/auth/session'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = { title: 'Nhà phát triển' }

export default async function DeveloperPage() {
  const profile = await requirePermission('api_keys:write')

  const keys = await listApiKeys(profile.id)

  return (
    <div className="p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nhà phát triển</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quản lý API key và tích hợp bên ngoài
        </p>
      </div>

      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="llm-providers">Nhà cung cấp LLM</TabsTrigger>
          <TabsTrigger value="api-reference">Tài liệu API</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysManager initialKeys={keys} />
        </TabsContent>

        <TabsContent value="llm-providers" className="mt-6">
          <LLMProvidersManager />
        </TabsContent>

        <TabsContent value="api-reference" className="mt-6">
          <ApiReferenceSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
