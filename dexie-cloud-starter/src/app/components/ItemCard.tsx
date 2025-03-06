'use client'

import React, { useRef, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CardContent, Dialog, DialogContent, IconButton } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ICard, getImagesByCardId, IImage } from '../db/db'
import Avatars from './Avatars'
import { Box } from '@mui/system'
import Image from 'next/image'
import CloseIcon from '@mui/icons-material/Close'

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
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const router = useRouter()
  const pathname = usePathname()
  const isOnEverythingPage = pathname.startsWith('/everything')

  const contentRef = useRef<HTMLDivElement>(null)
  const [isScaled, setIsScaled] = useState(false)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [images, setImages] = useState<IImage[]>([])
  const [open, setOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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
    async function fetchImages() {
      if (item.id) {
        const imageList = await getImagesByCardId(item.id)

        const imagesWithFile = await Promise.all(
          imageList.map(async (img) => {
            const response = await fetch(img.fileUrl)
            const blob = await response.blob()
            const file = new File([blob], `image-${img.id}`, {
              type: img.fileType,
            })

            return { ...img, file }
          }),
        )

        setImages(imagesWithFile)
      }
    }
    fetchImages()
  }, [item.id])

  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedImage(null)
  }

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
            {images.length > 0 ? (
              images.map((img, index) => {
                const imageSrc = URL.createObjectURL(img.file)
                return (
                  <Image
                    key={index}
                    src={imageSrc}
                    alt={`Uploaded ${index}`}
                    layout="responsive"
                    width={500}
                    height={300}
                    style={{ maxWidth: '100%' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImageClick(imageSrc)
                    }}
                  />
                )
              })
            ) : (
              <p>No images found.</p>
            )}
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
      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <DialogContent sx={{ position: 'relative', padding: '16px' }}>
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'gray' }}
          >
            <CloseIcon />
          </IconButton>
          <div
            style={{
              width: '50rem',
              height: '50rem',
              background: 'linear-gradient(to top, white, transparent)',
            }}
          >
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Preview"
                layout="responsive"
                width={800}
                height={500}
                style={{ maxWidth: '100%', borderRadius: '6px' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ItemCard
