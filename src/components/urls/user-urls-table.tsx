'use client';

import {
  Copy,
  Edit,
  ExternalLink,
  QrCode,
  Trash2Icon,
  Check,
  LinkIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { deleteUrl } from '@/server/actions/urls/delete-url';
import { QRCodeModal } from '../modals/qr-code-modal';
import { EditUrlModal } from '../modals/edit-url-modal';
import { BASEURL } from '@/lib/const';
import { cn } from '@/lib/utils';

interface Url {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
}

interface UserUrlsTableProps {
  urls: Url[];
}

export function UserUrlsTable({ urls }: UserUrlsTableProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [localUrls, setLocalUrls] = useState<Url[]>(urls);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeShortCode, setQrCodeShortCode] = useState<string>('');
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [urlToEdit, setUrlToEdit] = useState<{
    id: number;
    shortCode: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const baseUrl = BASEURL;

  const copyToClipboard = async (id: number, shortCode: string) => {
    const shortUrl = `${baseUrl}/r/${shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      const response = await deleteUrl(id);
      if (response.success) {
        setLocalUrls((prev) => prev.filter((url) => url.id !== id));
        toast.success('Link deleted');
      } else {
        toast.error('Failed to delete', { description: response.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(null);
    }
  };

  const showQrCode = (shortCode: string) => {
    const shortUrl = `${baseUrl}/r/${shortCode}`;
    setQrCodeUrl(shortUrl);
    setQrCodeShortCode(shortCode);
    setIsQrCodeModalOpen(true);
  };

  const handleEdit = (id: number, shortCode: string) => {
    setUrlToEdit({ id, shortCode });
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (newShortCode: string) => {
    if (!urlToEdit) return;
    setLocalUrls((prev) =>
      prev.map((url) =>
        url.id === urlToEdit.id ? { ...url, shortCode: newShortCode } : url,
      ),
    );
  };

  if (localUrls.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
        <div className='size-14 rounded-2xl bg-muted flex items-center justify-center mb-4'>
          <LinkIcon className='size-6 text-muted-foreground' />
        </div>
        <h3 className='font-semibold mb-2'>No links yet</h3>
        <p className='text-sm text-muted-foreground max-w-xs'>
          Create your first shortened link using the form above. Start sharing
          smarter links today.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className='hidden md:block'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-border/60'>
              <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                Original URL
              </th>
              <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                Short Link
              </th>
              <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-20'>
                Clicks
              </th>
              <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32'>
                Created
              </th>
              <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border/40'>
            {localUrls.map((url) => {
              const shortUrl = `${baseUrl}/r/${url.shortCode}`;
              return (
                <tr
                  key={url.id}
                  className='group hover:bg-muted/30 transition-colors'
                >
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2 max-w-xs'>
                      <span
                        className='text-sm text-muted-foreground truncate'
                        title={url.originalUrl}
                      >
                        {url.originalUrl}
                      </span>
                      <a
                        href={url.originalUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100'
                      >
                        <ExternalLink className='size-3.5' />
                      </a>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-1.5'>
                      <span className='font-mono text-sm font-medium text-violet-600 dark:text-violet-400'>
                        /r/{url.shortCode}
                      </span>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground'>
                      {url.clicks}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(url.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className={cn(
                          'size-7 transition-colors',
                          copiedId === url.id
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => copyToClipboard(url.id, url.shortCode)}
                      >
                        {copiedId === url.id ? (
                          <Check className='size-3.5' />
                        ) : (
                          <Copy className='size-3.5' />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 text-muted-foreground hover:text-foreground'
                        onClick={() => showQrCode(url.shortCode)}
                      >
                        <QrCode className='size-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400'
                        onClick={() => handleEdit(url.id, url.shortCode)}
                      >
                        <Edit className='size-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 text-muted-foreground hover:text-destructive'
                        onClick={() => handleDelete(url.id)}
                        disabled={isDeleting === url.id}
                      >
                        {isDeleting === url.id ? (
                          <span className='size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        ) : (
                          <Trash2Icon className='size-3.5' />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className='md:hidden divide-y divide-border/40'>
        {localUrls.map((url) => {
          const shortUrl = `${baseUrl}/r/${url.shortCode}`;
          return (
            <div key={url.id} className='p-4 space-y-3'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1 min-w-0'>
                  <p className='font-mono text-sm font-semibold text-violet-600 dark:text-violet-400 truncate'>
                    /r/{url.shortCode}
                  </p>
                  <p className='text-xs text-muted-foreground truncate mt-0.5'>
                    {url.originalUrl}
                  </p>
                </div>
                <span className='shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground'>
                  {url.clicks} clicks
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex-1 h-8 text-xs'
                  onClick={() => copyToClipboard(url.id, url.shortCode)}
                >
                  {copiedId === url.id ? (
                    <Check className='size-3 mr-1' />
                  ) : (
                    <Copy className='size-3 mr-1' />
                  )}
                  {copiedId === url.id ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  onClick={() => showQrCode(url.shortCode)}
                >
                  <QrCode className='size-3.5' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  onClick={() => handleEdit(url.id, url.shortCode)}
                >
                  <Edit className='size-3.5' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8 text-destructive border-destructive/20 hover:bg-destructive/10'
                  onClick={() => handleDelete(url.id)}
                  disabled={isDeleting === url.id}
                >
                  <Trash2Icon className='size-3.5' />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <QRCodeModal
        isOpen={isQrCodeModalOpen}
        onOpenChange={setIsQrCodeModalOpen}
        url={qrCodeUrl}
        shortCode={qrCodeShortCode}
      />

      {urlToEdit && (
        <EditUrlModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          urlId={urlToEdit.id}
          currentShortCode={urlToEdit.shortCode}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
