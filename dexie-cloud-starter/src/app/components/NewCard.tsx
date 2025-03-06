'use client'

import { useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { createCard, addImageToCard, getFilesByCardId } from '../db/db'
import dayjs from 'dayjs'
import Tiptap from '@/app/components/tiptap'
import theme from '@/theme'
import Button from '@mui/material/Button'
import { Typography, CardContent } from '@mui/material'
import { useSearch } from '../(pages)/SearchContext'
import { ContentCard, ContentWrapper } from './ItemCard'
import * as Y from 'yjs'
import { Editor } from '@tiptap/react'
import Dropzone from 'react-dropzone'

interface NewCardProps {
  spaceId?: string
}

const NewCard = ({ spaceId }: NewCardProps) => {
  const [canPost, setCanPost] = useState(false)
  const { setSearchKeyword } = useSearch()
  const editorRef = useRef<Editor | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [tempDoc] = useState(() => new Y.Doc())
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([])

  const handlePost = async () => {
    let currentCardId = cardId
    if (!currentCardId) {
      currentCardId = uuid()
      setCardId(currentCardId)

      try {
        await createCard({
          id: currentCardId,
          createdAt: dayjs().toISOString(),
          title: 'New Card',
          doc: tempDoc,
          spaceId,
          fullTextIndex: [],
        })
        console.log(' New card created:', currentCardId)
      } catch (error) {
        console.error(' Error creating card:', error)
        return
      }
    }

    for (const file of acceptedFiles) {
      try {
        await addImageToCard(currentCardId, file)
        console.log('Image saved:', file.name)
      } catch (error) {
        console.error(' Error saving image:', error)
      }
    }

    const images = await getFilesByCardId(currentCardId)
    console.log('📸 Retrieved Images after upload:', images)

    setSearchKeyword('')
    setCanPost(false)
  }

  const handleOnDrop = (acceptedFiles: File[]) => {
    setAcceptedFiles(acceptedFiles)
  }

  return (
    <div>
      <ContentCard sx={{ position: 'relative', pb: 4 }} isScaled={false}>
        <ContentWrapper scaleFactor={1}>
          <CardContent>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                fontSize: '0.75rem',
                pb: 0.5,
              }}
            >
              ADD NEW NOTE
            </Typography>

            <Tiptap
              yDoc={tempDoc}
              setCanPost={setCanPost}
              onPost={handlePost}
              editorRef={editorRef}
            />

            <Dropzone onDrop={handleOnDrop}>
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div
                    {...getRootProps()}
                    style={{
                      border: '1px dashed gray',
                      padding: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input {...getInputProps()} />
                    <p>📂 Drag & Drop files here, or click to select</p>
                  </div>
                </section>
              )}
            </Dropzone>

            {canPost && (
              <Button
                variant="contained"
                color="primary"
                onClick={handlePost}
                disabled={!canPost}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '100%',
                  borderRadius: 0,
                }}
              >
                PRESS CTRL+ENTER TO SAVe
              </Button>
            )}
          </CardContent>
        </ContentWrapper>
      </ContentCard>
    </div>
  )
}

export default NewCard
