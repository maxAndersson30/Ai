'use client'

import React, { useRef, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CardContent } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ICard, getFilesByCardId, IFile } from '../db/db'
import Avatars from './Avatars'
import { Box } from '@mui/system'
import Image from 'next/image'

export const HEIGHT_THRESHOLD = 500 // px
export const FIXED_HEIGHT = 200 // px

export const ContentCard = styled('div')<{ isScaled: boolean }>(
  ({ isScaled }) => ({
    height: isScaled ? `${FIXED_HEIGHT}px` : 'auto',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '3px 10px 37px -4px rgba(42, 52, 68, 0.5)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s, height 0.3s',
    overflow: isScaled ? 'hidden' : 'visible',
    position: 'relative',
    borderRadius: '6px',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '4px 12px 40px -4px rgba(42, 52, 68, 0.6)',
      outline: '2px solid gray',
    },
    '&:focus': {
      outline: '2px solid gray',
    },
  }),
)

export const ContentWrapper = styled('div')<{ scaleFactor: number }>(
  ({ scaleFactor }) => ({
    zoom: scaleFactor < 1 ? '0.5' : '1',
    transition: 'zoom 0.3s',
    width: '100%',
    overflowX: 'hidden',
  }),
)

interface ItemCardProps {
  item: ICard
  onFileClick: (fileUrl: string) => void
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onFileClick }) => {
  const router = useRouter()
  const pathname = usePathname()
  const isOnEverythingPage = pathname.startsWith('/everything')

  const contentRef = useRef<HTMLDivElement>(null)
  const [isScaled, setIsScaled] = useState(false)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [files, setFiles] = useState<IFile[]>([])

  const handleClick = () => {
    router.push(`?edit=${item.id}`)
  }

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight
      if (contentHeight > HEIGHT_THRESHOLD) {
        const newScaleFactor = FIXED_HEIGHT / contentHeight
        setScaleFactor(newScaleFactor < 1 ? newScaleFactor : 1)
        setIsScaled(newScaleFactor < 1)
      } else {
        setScaleFactor(1)
        setIsScaled(false)
      }
    }
  }, [item.docHtml])

  useEffect(() => {
    async function fetchFiles() {
      if (item.id) {
        const fileList = await getFilesByCardId(item.id)

        const filesWithFile = await Promise.all(
          fileList.map(async (file) => {
            const response = await fetch(file.fileUrl)
            const blob = await response.blob()
            const newFile = new File([blob], `file-${file.id}`, {
              type: file.fileType,
            })
            return { ...file, file: newFile }
          }),
        )

        setFiles(filesWithFile)
      }
    }
    fetchFiles()
  }, [item.id])

  return (
    <>
      <ContentCard
        onClick={handleClick}
        isScaled={isScaled}
        tabIndex={0}
        aria-label={`Edit item ${item.id}`}
      >
        {isOnEverythingPage && (
          <Box sx={{ position: 'absolute', right: 10, top: 10 }}>
            <Avatars realmId={item.realmId as string} compact />
          </Box>
        )}
        <ContentWrapper scaleFactor={scaleFactor}>
          <CardContent
            sx={{
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                cursor: 'pointer',
              },
            }}
          >
            {files.map((file, index) => {
              const fileSrc = URL.createObjectURL(file.file)
              return (
                <div
                  key={index}
                  onClick={() => onFileClick(fileSrc)}
                  style={{ cursor: 'pointer' }}
                >
                  {file.fileType.startsWith('image/') ? (
                    <Image
                      src={fileSrc}
                      alt={`Uploaded ${index}`}
                      layout="responsive"
                      width={500}
                      height={300}
                    />
                  ) : (
                    <p>File: {file.fileType}</p>
                  )}
                </div>
              )
            })}
            <div
              ref={contentRef}
              className="editor-content"
              dangerouslySetInnerHTML={{
                __html: item.docHtml || '',
              }}
            />
          </CardContent>
        </ContentWrapper>
        {isScaled && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '50px',
              background: 'linear-gradient(to top, white, transparent)',
            }}
          />
        )}
      </ContentCard>
    </>
  )
}

export default ItemCard
