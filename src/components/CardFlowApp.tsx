import React, { useState, useRef, useEffect } from 'react';
import { Plus, Settings, X, ArrowLeft, Trash2 } from 'lucide-react';

/*
  IMPORTANT NOTE: This app is designed exclusively for mobile and tablet devices.
  All hover effects have been removed as they are not applicable for touch interfaces.
  The app relies on touch interactions (tap, swipe, drag) instead of mouse hover states.
*/

const CardFlowApp = () => {
  const [columns, setColumns] = useState([
    {
      id: 1,
      name: 'Classes',
      cards: [
        { id: 1, content: 'Math homework', label: 'todo' },
        { id: 2, content: 'English report', label: 'todo' },
        { id: 3, content: 'Physics experiment', label: 'todo' },
        { id: 4, content: 'Chemistry lab report', label: 'doing' },
        { id: 5, content: 'History essay', label: 'done' },
        { id: 6, content: 'Biology presentation', label: 'done' },
        { id: 7, content: 'Literature analysis', label: 'done' }
      ]
    },
    {
      id: 2,
      name: 'Research',
      cards: [
        { id: 8, content: 'Paper writing', label: 'todo' },
        { id: 9, content: 'Data analysis', label: 'todo' },
        { id: 10, content: 'Experiment planning', label: 'todo' },
        { id: 11, content: 'Literature review', label: 'todo' },
        { id: 12, content: 'Survey design', label: 'doing' },
        { id: 13, content: 'Statistical analysis', label: 'doing' },
        { id: 14, content: 'Research proposal', label: 'doing' },
        { id: 15, content: 'Peer review', label: 'done' },
        { id: 16, content: 'Conference presentation', label: 'done' },
        { id: 17, content: 'Journal submission', label: 'done' },
        { id: 18, content: 'Grant application', label: 'done' },
        { id: 19, content: 'Methodology review', label: 'done' }
      ]
    },
    {
      id: 3,
      name: 'Home',
      cards: [
        { id: 20, content: 'Create shopping list', label: 'todo' },
        { id: 21, content: 'Laundry', label: 'todo' },
        { id: 22, content: 'Cleaning', label: 'doing' },
        { id: 23, content: 'Garden maintenance', label: 'doing' },
        { id: 24, content: 'Cooking', label: 'done' },
        { id: 25, content: 'Home repairs', label: 'done' }
      ]
    }
  ]);

  const [selectedColumn, setSelectedColumn] = useState(null);
  const [visibleCardIndexes, setVisibleCardIndexes] = useState({});
  const [editingCard, setEditingCard] = useState(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState(null);
  const [newCardContent, setNewCardContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(null);

  // 列並び替え用の状態
  const [showReorderIcon, setShowReorderIcon] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState(null);
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const reorderTimeoutRef = useRef(null);

  // カテゴリ別スクロール位置の状態
  const [categoryScrollPositions, setCategoryScrollPositions] = useState({
    todo: 0,
    doing: 0,
    done: 0
  });

  // スワイプ検出用の状態
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0, category: null });
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  // スライドバー用の状態
  const [showSlideBar, setShowSlideBar] = useState(true);
  const [slideBarTimeout, setSlideBarTimeout] = useState(null);

  const [labelSettings, setLabelSettings] = useState({
    done: { bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-700', name: 'Done', color: 'stone' },
    doing: { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-white', name: 'In Progress', color: 'amber' },
    todo: { bg: 'bg-slate-600', border: 'border-slate-700', text: 'text-white', name: 'To Do', color: 'slate' }
  });

  // タッチイベント用のref
  const touchStartRef = useRef({ x: 0, y: 0 });
  const cardStackRef = useRef(null);
  const moveThrottleRef = useRef(null);

  // カスタムカードスタックアイコン
  const CardStackIcon = ({
    size = 20,
    colorTodo,
    colorDoing,
    colorDone,
  }: {
    size?: number;
    colorTodo: string;
    colorDoing: string;
    colorDone: string;
  }) => (
    <svg width={size} height={size} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      {/* Done → 一番上のカード */}
      <rect x="1" y="1" width="798" height="250" rx="40" ry="40" fill={colorDone} stroke="black" strokeWidth="2" />
    
      {/* Doing → 真ん中のカード */}
      <rect x="1" y="150" width="798" height="250" rx="40" ry="40" fill={colorDoing} stroke="black" strokeWidth="2" />
    
      {/* To Do → 一番下のカード */}
      <rect x="1" y="300" width="798" height="500" rx="40" ry="40" fill={colorTodo} stroke="black" strokeWidth="2" />
    </svg>
  );

  // 色選択オプション
  const colorOptions = [
    { name: 'stone', bg: 'bg-stone-100', border: 'border-stone-300', text: 'text-stone-700' },
    { name: 'slate', bg: 'bg-slate-600', border: 'border-slate-700', text: 'text-white' },
    { name: 'red', bg: 'bg-red-600', border: 'border-red-700', text: 'text-white' },
    { name: 'yellow', bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-white' },
    { name: 'blue', bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white' },
    { name: 'purple', bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-white' },
    { name: 'amber', bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-white' },
    { name: 'teal', bg: 'bg-teal-600', border: 'border-teal-700', text: 'text-white' }
  ];

  const tailwindColorMap = {
  'bg-stone-100': '#f5f5f4',
  'bg-slate-600': '#475569',
  'bg-amber-600': '#d97706',
  'bg-red-600': '#dc2626',
  'bg-yellow-500': '#eab308',
  'bg-blue-600': '#2563eb',
  'bg-purple-600': '#9333ea',
  'bg-teal-600': '#0d9488'
  };
  
  // スライドバー表示制御
  const showSlideBarTemporarily = () => {
    setShowSlideBar(true);
    
    // 既存のタイマーをクリア
    if (slideBarTimeout) {
      clearTimeout(slideBarTimeout);
    }
    
    // 3秒後に非表示
    const timeout = setTimeout(() => {
      setShowSlideBar(false);
    }, 3000);
    
    setSlideBarTimeout(timeout);
  };

  // スライドバーでの列切り替え
  const handleSlideBarChange = (direction) => {
    if (selectedColumn === null) return;
    
    let newColumnIndex = selectedColumn;
    
    if (direction === 'prev' && selectedColumn > 0) {
      newColumnIndex = selectedColumn - 1;
    } else if (direction === 'next' && selectedColumn < columns.length - 1) {
      newColumnIndex = selectedColumn + 1;
    }
    
    if (newColumnIndex !== selectedColumn) {
      setSelectedColumn(newColumnIndex);
      // スクロール位置をリセット
      setCategoryScrollPositions({ todo: 0, doing: 0, done: 0 });
      // スライドバーを一時的に表示
      showSlideBarTemporarily();
    }
  };

  // カテゴリ別スクロール処理
  const scrollCategory = (category, direction) => {
    const categoryCards = columns[selectedColumn].cards.filter(card => card.label === category);
    const maxScroll = Math.max(0, categoryCards.length - 1);
    
    setCategoryScrollPositions(prev => {
      const currentPos = prev[category] || 0;
      let newPos;
      
      if (direction === 'next') {
        newPos = Math.min(currentPos + 1, maxScroll);
      } else {
        newPos = Math.max(currentPos - 1, 0);
      }
      
      return {
        ...prev,
        [category]: newPos
      };
    });
  };

  // カードエリアスワイプ開始処理
  const handleSwipeStart = (e, category) => {
    if (selectedColumn === null) return;
    
    const touch = e.touches[0];
    setSwipeStart({
      x: touch.clientX,
      y: touch.clientY,
      category: category
    });
    setIsSwipeActive(true);
  };

  // カードエリアスワイプ移動処理
  const handleSwipeMove = (e) => {
    if (!isSwipeActive || !swipeStart.category) return;
    
    e.preventDefault(); // スクロールを防ぐ
  };

  // カードエリアスワイプ終了処理
  const handleSwipeEnd = (e) => {
    if (!isSwipeActive || !swipeStart.category) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    
    // スワイプの閾値
    const minSwipeDistance = 50;
    
    // 絶対値で最も大きい方向を判定
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (Math.max(absDeltaX, absDeltaY) > minSwipeDistance) {
      // 縦スワイプ、横スワイプ、斜めスワイプすべてに対応
      if (absDeltaX > absDeltaY) {
        // 横方向が主体
        if (deltaX > 0) {
          // 右スワイプ - 前のカードへ
          scrollCategory(swipeStart.category, 'prev');
        } else {
          // 左スワイプ - 次のカードへ
          scrollCategory(swipeStart.category, 'next');
        }
      } else {
        // 縦方向が主体
        if (deltaY > 0) {
          // 下スワイプ - 前のカードへ
          scrollCategory(swipeStart.category, 'prev');
        } else {
          // 上スワイプ - 次のカードへ
          scrollCategory(swipeStart.category, 'next');
        }
      }
    }
    
    // スワイプ状態をリセット
    setSwipeStart({ x: 0, y: 0, category: null });
    setIsSwipeActive(false);
  };

  // タッチイベントハンドラー
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;

    // 移動アイコンが表示されている時は、横スワイプを制限
    if (showReorderIcon !== null) {
      e.preventDefault();
      return;
    }

    // 単一列表示の場合は縦スクロールを防ぐ
    if (selectedColumn !== null) {
      e.preventDefault();
      return;
    }

    const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

    // 横方向のスワイプが縦方向より大きい場合、縦スクロールを防ぐ
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  };

  // カードの下側タップ処理
  const handleCardBottomTap = (columnIndex) => {
   
    // 俯瞰画面でない場合は何もしない
    if (selectedColumn !== null) {
      return;
    }
    
    // 既に表示されている場合は非表示にする
    if (showReorderIcon === columnIndex) {
      setShowReorderIcon(null);
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
      return;
    }

    setShowReorderIcon(columnIndex);
    
    // 3秒後に自動で非表示
    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
    }
    reorderTimeoutRef.current = setTimeout(() => {
      setShowReorderIcon(null);
    }, 3000);
  };

  // グローバルクリック処理 - 青い円形アイコン以外をクリックで非表示
  const handleGlobalClick = (e) => {
    // 青い円形アイコンが表示されている場合のみ処理
    if (showReorderIcon === null) return;
    
    // クリックされた要素が青い円形アイコンかどうかチェック
    const isDragHandle = e.target.closest('.drag-handle');
    
    if (!isDragHandle) {
      setShowReorderIcon(null);
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
    }
  };

  // ドラッグ開始
  const handleDragStart = (e, columnIndex) => {
    
    e.stopPropagation();
    e.preventDefault();
    
    // 初期位置を記録
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    setDragStartPosition({ x: clientX, y: clientY });
    setGhostPosition({ x: clientX, y: clientY });
    
    // ドラッグ状態を設定
    setIsDragging(true);
    setDraggedColumnIndex(columnIndex);
    setDragOverColumnIndex(null);
    
  };

  // マウス/タッチ移動処理（スロットル付き）
  const handleMove = (e) => {
    if (!isDragging || draggedColumnIndex === null) return;
    
    e.preventDefault();
    
    // スロットル処理でパフォーマンス向上
    if (moveThrottleRef.current) {
      clearTimeout(moveThrottleRef.current);
    }
    
    moveThrottleRef.current = setTimeout(() => {
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      
      // ゴーストの位置を更新
      setGhostPosition({ x: clientX, y: clientY });
      
      // マウス位置から対象列を特定
      const elements = document.elementsFromPoint(clientX, clientY);
      const columnElement = elements.find(el => el.dataset.columnIndex);
      
      if (columnElement) {
        const targetIndex = parseInt(columnElement.dataset.columnIndex);
        if (targetIndex !== draggedColumnIndex && targetIndex !== dragOverColumnIndex) {
          setDragOverColumnIndex(targetIndex);
        }
      } else {
        setDragOverColumnIndex(null);
      }
    }, 16); // 60fps相当
  };

  // ドラッグ終了
  const handleDragEnd = (e) => {
    if (!isDragging || draggedColumnIndex === null) return;
   
    // スロットルをクリア
    if (moveThrottleRef.current) {
      clearTimeout(moveThrottleRef.current);
    }
    
    // 列の入れ替えを実行（ドロップ先が指定されている場合のみ）
    if (dragOverColumnIndex !== null && dragOverColumnIndex !== draggedColumnIndex) {
      
      const newColumns = [...columns];
      const draggedColumn = newColumns[draggedColumnIndex];
      
      // 元の位置から削除
      newColumns.splice(draggedColumnIndex, 1);
      
      // 新しい位置に挿入
      newColumns.splice(dragOverColumnIndex, 0, draggedColumn);
      
      setColumns(newColumns);
    } else {
    }
    
    // 状態をリセット
    setIsDragging(false);
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
    setShowReorderIcon(null);
    setGhostPosition({ x: 0, y: 0 });
    
    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
    }
  };

  // グローバルイベントリスナー
  useEffect(() => {
    if (isDragging) {
      
      const handleMouseMove = (e) => handleMove(e);
      const handleMouseUp = (e) => handleDragEnd(e);
      const handleTouchMove = (e) => handleMove(e);
      const handleTouchEnd = (e) => handleDragEnd(e);
      
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, draggedColumnIndex, dragOverColumnIndex]);

  // グローバルクリックリスナー
  useEffect(() => {
    if (showReorderIcon !== null) {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('touchend', handleGlobalClick);
      
      return () => {
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('touchend', handleGlobalClick);
      };
    }
  }, [showReorderIcon]);

  // 列内容表示画面に入った時にスライドバーを表示
  useEffect(() => {
    if (selectedColumn !== null) {
      showSlideBarTemporarily();
    }
  }, [selectedColumn]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
      if (moveThrottleRef.current) {
        clearTimeout(moveThrottleRef.current);
      }
      if (slideBarTimeout) {
        clearTimeout(slideBarTimeout);
      }
    };
  }, [slideBarTimeout]);

  const addNewCard = () => {
    if (!newCardContent.trim()) return;
    
    // 俯瞰画面の場合は新しい列を作成
    if (selectedColumn === null) {
      const newColumn = {
        id: Date.now(),
        name: newCardContent,
        cards: [
          {
            id: Date.now() + 1,
            content: '',
            label: 'todo'
          }
        ]
      };
      setColumns([...columns, newColumn]);
      setNewCardContent('');
      return;
    }
    
    // 単一列表示の場合は新しいカードを追加
    const newCard = {
      id: Date.now(),
      content: newCardContent,
      label: 'todo'
    };

    const updatedColumns = [...columns];
    updatedColumns[selectedColumn].cards.unshift(newCard);
    setColumns(updatedColumns);
    setNewCardContent('');
  };

  const editCard = (columnIndex, cardIndex) => {
    setEditingCard({
      columnIndex,
      cardIndex,
      cardId: columns[columnIndex].cards[cardIndex].id,
      content: columns[columnIndex].cards[cardIndex].content,
      label: columns[columnIndex].cards[cardIndex].label
    });
  };

  const saveCard = () => {
    if (!editingCard) return;
    
    const updatedColumns = [...columns];
    const cardIndex = updatedColumns[editingCard.columnIndex].cards.findIndex(
      card => card.id === editingCard.cardId
    );
    
    if (cardIndex !== -1) {
      updatedColumns[editingCard.columnIndex].cards[cardIndex] = {
        ...updatedColumns[editingCard.columnIndex].cards[cardIndex],
        content: editingCard.content,
        label: editingCard.label
      };
      setColumns(updatedColumns);
    }
    setEditingCard(null);
  };

  const deleteCard = () => {
    setDeleteTarget({ type: 'card', data: editingCard });
    setShowDeleteConfirm(true);
  };

  const deleteColumn = () => {
    setDeleteTarget({ type: 'column', data: selectedColumn });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'card') {
      const editingCard = deleteTarget.data;
      const updatedColumns = [...columns];
      const cardIndex = updatedColumns[editingCard.columnIndex].cards.findIndex(
        card => card.id === editingCard.cardId
      );
      
      if (cardIndex !== -1) {
        updatedColumns[editingCard.columnIndex].cards.splice(cardIndex, 1);
        
        if (updatedColumns[editingCard.columnIndex].cards.length === 0) {
          updatedColumns.splice(editingCard.columnIndex, 1);
          if (selectedColumn >= updatedColumns.length) {
            setSelectedColumn(Math.max(0, updatedColumns.length - 1));
          }
        }
        
        setColumns(updatedColumns);
      }
      setEditingCard(null);
    } else if (deleteTarget.type === 'column') {
      const columnIndex = deleteTarget.data;
      const updatedColumns = [...columns];
      updatedColumns.splice(columnIndex, 1);
      setColumns(updatedColumns);
      setSelectedColumn(null);
    }

    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const editColumnTitle = (columnIndex) => {
    setEditingColumnTitle({
      index: columnIndex,
      title: columns[columnIndex].name
    });
  };

  const saveColumnTitle = () => {
    if (!editingColumnTitle) return;
    
    const updatedColumns = [...columns];
    updatedColumns[editingColumnTitle.index].name = editingColumnTitle.title;
    setColumns(updatedColumns);
    setEditingColumnTitle(null);
  };

  const selectColor = (labelKey, color) => {
    setLabelSettings({
      ...labelSettings,
      [labelKey]: { 
        ...labelSettings[labelKey],
        bg: color.bg, 
        border: color.border, 
        text: color.text, 
        color: color.name 
      }
    });
    setShowColorPicker(null);
  };

  // 円形配置の座標計算
  const getCirclePosition = (index, total) => {
    const centerX = 120;
    const centerY = 100;
    const radius = 60;
    const angle = (index * 2 * Math.PI) / total;
    
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);
    
    return { x, y };
  };

  // 初期表示時に全ての列で最初のカードを表示
  useEffect(() => {
    const initialVisibleIndexes = {};
    columns.forEach((column, columnIndex) => {
      initialVisibleIndexes[columnIndex] = 0;
    });
    setVisibleCardIndexes(initialVisibleIndexes);
  }, [columns.length]);

  if (editingCard) {
    // 現在選択されているカテゴリの色設定を取得
    const currentLabelConfig = labelSettings[editingCard.label];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 mt-8 border border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setEditingCard(null)}
              className="p-2 rounded-full transition-colors bg-stone-100"
            >
              <ArrowLeft size={20} className="text-stone-600" />
            </button>
            <h2 className="text-xl font-semibold text-stone-800">Edit Card</h2>
            <div className="w-10"></div>
          </div>
          
          {/* テキストエリアを選択されたカテゴリの色に合わせる */}
          <textarea
            value={editingCard.content}
            onChange={(e) => setEditingCard({...editingCard, content: e.target.value})}
            className={`w-full h-32 p-3 border-2 rounded-lg focus:border-amber-400 focus:outline-none resize-none ${currentLabelConfig.bg} ${currentLabelConfig.border} ${currentLabelConfig.text}`}
            placeholder="Enter task content..."
            autoFocus
          />
          
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-stone-700">Status</label>
              <div className="flex gap-2">
                {/* ステータスボタンの順序を修正: todo, doing, done */}
                {['todo', 'doing', 'done'].map((key) => {
                  const config = labelSettings[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setEditingCard({...editingCard, label: key})}
                      className={`px-4 py-2 rounded-lg border-2 ${config.bg} ${config.border} ${config.text} ${
                        editingCard.label === key ? 'ring-2 ring-amber-400' : 'filter sepia-[0.8] saturate-50 opacity-75'
                      } transition-all text-sm font-medium shadow-sm`}
                    >
                      {config.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={saveCard}
              className="flex-1 bg-stone-600 text-white py-2 px-4 rounded-lg transition-colors font-medium shadow-sm"
            >
              Save
            </button>
            <button
              onClick={deleteCard}
              className="px-4 py-2 bg-white text-black border border-stone-300 rounded-lg transition-colors shadow-sm"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-stone-200 p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-stone-800">CardFlow</h1>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-stone-50 rounded-lg p-1 border border-stone-200">
              <input
                type="text"
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNewCard()}
                placeholder={selectedColumn === null ? "New column..." : "New task..."}
                className="bg-transparent px-3 py-2 outline-none text-sm w-48 text-stone-700"
              />
              <button
                onClick={addNewCard}
                className="bg-stone-600 text-white p-2 rounded-md transition-colors shadow-sm"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full transition-colors bg-stone-50 border border-stone-300 shadow-sm"
            >
              <Settings size={20} className="text-stone-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 上側スライドバー（列内容表示画面のみ） */}
      {selectedColumn !== null && (
        <div 
          className={`fixed top-20 left-0 right-0 z-40 transition-all duration-300 ${
            showSlideBar ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onTouchStart={showSlideBarTemporarily}
          onClick={showSlideBarTemporarily}
        >
          <div className="flex justify-center">
            <div className="bg-stone-500 bg-opacity-80 rounded-full px-6 py-2 flex items-center gap-4 shadow-lg">
              <button
                onClick={() => handleSlideBarChange('prev')}
                disabled={selectedColumn === 0}
                className={`p-2 rounded-full transition-colors ${
                  selectedColumn === 0 
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                    : 'bg-white text-stone-700'
                }`}
              >
                <ArrowLeft size={16} />
              </button>
              
              <div className="text-white text-sm font-medium min-w-max">
                {selectedColumn + 1} / {columns.length}
              </div>
              
              <button
                onClick={() => handleSlideBarChange('next')}
                disabled={selectedColumn === columns.length - 1}
                className={`p-2 rounded-full transition-colors ${
                  selectedColumn === columns.length - 1 
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                    : 'bg-white text-stone-700'
                }`}
              >
                <ArrowLeft size={16} className="transform rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フローティングゴースト */}
      {isDragging && draggedColumnIndex !== null && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: ghostPosition.x,
            top: ghostPosition.y,
          }}
        >
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-2xl border-4 border-white transform rotate-3 scale-110"
            style={{
              minWidth: '200px',
              minHeight: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.1
            }}
          >
          </div>
        </div>
      )}

      {/* メインエリア */}
      <div 
        className="p-6 overflow-x-auto"
        onTouchStart={selectedColumn !== null ? undefined : handleTouchStart}
        onTouchMove={selectedColumn !== null ? undefined : handleTouchMove}
        style={{ 
          touchAction: showReorderIcon !== null ? 'none' : selectedColumn !== null ? 'none' : 'pan-x',
          userSelect: isDragging ? 'none' : 'auto'
        }}
      >
        {selectedColumn === null ? (
          // 全列表示
          <div className="flex gap-8 min-w-max max-w-6xl mx-auto">
            {columns.map((column, columnIndex) => {
              const visibleCardIndex = visibleCardIndexes[columnIndex] || 0;
              const isDraggedOver = dragOverColumnIndex === columnIndex;
              const isBeingDragged = draggedColumnIndex === columnIndex;
              const shouldShowReorderIcon = showReorderIcon === columnIndex;
              const shouldFade = showReorderIcon !== null && showReorderIcon !== columnIndex;
              const colorTodoHex  = tailwindColorMap[labelSettings.todo.bg]  || '#475569';
              const colorDoingHex = tailwindColorMap[labelSettings.doing.bg] || '#d97706';
              const colorDoneHex  = tailwindColorMap[labelSettings.done.bg]  || '#f5f5f4';

              return (
                <div
                  key={column.id}
                  data-column-index={columnIndex}
                  className={`relative transition-all duration-200 flex-shrink-0 ${
                    shouldFade ? 'opacity-40 filter grayscale' : ''
                  }`}
                  style={{
                    border: isDraggedOver ? '4px dashed #06b6d4' : 'none',
                    borderRadius: isDraggedOver ? '16px' : '0',
                    padding: isDraggedOver ? '16px' : '0',
                    backgroundColor: isDraggedOver ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    boxShadow: isDraggedOver ? '0 0 20px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.1)' : 'none',
                    transform: isBeingDragged ? 'scale(0.95) rotate(-2deg)' : isDraggedOver ? 'scale(1.05)' : 'scale(1)',
                    opacity: isBeingDragged ? 0.1 : 1,
                    filter: isBeingDragged ? 'blur(2px)' : 'none',
                    minHeight: isDraggedOver ? '400px' : 'auto'
                  }}
                >
                  {/* 列情報 - カードよりも優先表示 */}
                  <div className="mb-3 text-center relative z-10 bg-gradient-to-br from-stone-50 to-slate-100 rounded-lg p-2 shadow-sm border border-stone-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {editingColumnTitle && editingColumnTitle.index === columnIndex ? (
                        <input
                          type="text"
                          value={editingColumnTitle.title}
                          onChange={(e) => setEditingColumnTitle({...editingColumnTitle, title: e.target.value})}
                          onKeyPress={(e) => e.key === 'Enter' && saveColumnTitle()}
                          onBlur={saveColumnTitle}
                          className="text-lg font-semibold text-stone-700 bg-white border-2 border-amber-400 rounded px-2 py-1 text-center shadow-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <h3 
                            className="text-lg font-semibold text-stone-700 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              editColumnTitle(columnIndex);
                            }}
                          >
                            {column.name}
                          </h3>
                          <div className="text-sm text-stone-500">
                            ({column.cards.length})
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColumn(columnIndex);
                            }}
                            className="p-1 rounded-full transition-colors bg-stone-100 border border-stone-300 shadow-sm"
                          >
                            <CardStackIcon
                                size={16}
                                colorTodo={colorTodoHex}
                                colorDoing={colorDoingHex}
                                colorDone={colorDoneHex}
                            />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* カードスタック表示 */}
                  <div 
                    ref={cardStackRef}
                    className="card-stack-area relative select-none"
                    style={{ 
                      perspective: '800px',
                      height: '200px',
                      width: '200px'
                    }}
                  >
                    {column.cards.map((card, cardIndex) => {
                      const isVisible = cardIndex <= visibleCardIndex;
                      const isTop = cardIndex === visibleCardIndex;
                      const depth = visibleCardIndex - cardIndex;
                      
                      return (
                        <div key={card.id}>
                          <div
                            className={`card-content absolute w-48 h-28 rounded-lg shadow-lg border-2 transition-all duration-300 ${
                              labelSettings[card.label].bg
                            } ${labelSettings[card.label].border} overflow-hidden`}
                            style={{
                              transform: `
                                rotateX(20deg) 
                                translateY(${depth * 10 + 120}px) 
                                translateZ(${-depth * 6}px)
                              `,
                              opacity: 1,
                              zIndex: 100 - cardIndex,
                              transformOrigin: 'center bottom'
                            }}
                          >
                            {/* カード上半分 - カード内容エリア */}
                            <div className="absolute top-0 left-0 right-0 h-2/3 p-4 flex flex-col">
                              {/* カード番号を左上に表示 */}
                              {isTop && column.cards.length > 1 && (
                                <div className="absolute top-2 left-2 text-xs text-gray-500">
                                  {cardIndex + 1}
                                </div>
                              )}
                              
                              <div className={`text-sm font-medium overflow-hidden ${labelSettings[card.label].text} flex-1 flex items-center justify-center`}>
                                {card.content}
                              </div>
                            </div>

                            {/* カード下半分 - タップ認識エリア（透明、カードの3分の1） */}
                            {isTop && (
                              <div
                                className="absolute bottom-0 left-0 right-0 h-1/3 cursor-pointer"
                                style={{ 
                                  backgroundColor: 'transparent',
                                  zIndex: 1000
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleCardBottomTap(columnIndex);
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleCardBottomTap(columnIndex);
                                }}
                              >
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 独立したドラッグハンドル - モノクロ化・小さくする */}
                  {shouldShowReorderIcon && (
                    <div className="mt-6 flex justify-center">
                      <div
                        className="drag-handle bg-gray-500 text-white rounded-full p-1.5 shadow-2xl border-2 border-white cursor-move transition-all duration-200 select-none filter grayscale"
                        onMouseDown={(e) => {
                          handleDragStart(e, columnIndex);
                        }}
                        onTouchStart={(e) => {
                          handleDragStart(e, columnIndex);
                        }}
                        style={{
                          zIndex: 10000,
                          pointerEvents: 'auto',
                          userSelect: 'none'
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 19v-2h10v2H7zm0-6v-2h10v2H7zm0-6V5h10v2H7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // 単一列表示 - 3カテゴリ同時表示（スワイプ対応・スライドバー対応）
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setSelectedColumn(null)}
                className="bg-stone-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              
              {/* 列名とゴミ箱アイコンを離して配置 */}
              <div className="flex items-center gap-8">
                {editingColumnTitle && editingColumnTitle.index === selectedColumn ? (
                  <input
                    type="text"
                    value={editingColumnTitle.title}
                    onChange={(e) => setEditingColumnTitle({...editingColumnTitle, title: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && saveColumnTitle()}
                    onBlur={saveColumnTitle}
                    className="text-2xl font-bold text-stone-700 bg-white border-2 border-amber-400 rounded px-2 py-1 text-center shadow-sm"
                    autoFocus
                  />
                ) : (
                  <h2 
                    className="text-2xl font-bold text-stone-700 cursor-pointer transition-colors"
                    onClick={() => editColumnTitle(selectedColumn)}
                  >
                    {columns[selectedColumn].name}
                  </h2>
                )}
                <button
                  onClick={deleteColumn}
                  className="bg-white text-black border border-stone-300 p-2 rounded-lg transition-colors shadow-sm"
                  title={`Delete ${columns[selectedColumn].name} column`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="w-20"></div> {/* 右側のスペース調整 */}
            </div>

            {/* 3カテゴリ同時表示（スワイプ対応・さらに大きなズレ） */}
            <div className="flex gap-16 justify-center min-w-max">
              {['todo', 'doing', 'done'].map((category) => {
                const categoryConfig = labelSettings[category];
                const categoryCards = columns[selectedColumn].cards.filter(card => card.label === category);
                const scrollPosition = categoryScrollPositions[category] || 0;
                
                return (
                  <div key={category} className="flex-1 max-w-sm">
                    {/* カテゴリヘッダー */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold ${categoryConfig.text === 'text-white' ? 'text-stone-700' : categoryConfig.text}`}>
                          {categoryConfig.name}
                        </h3>
                        <div className="text-sm text-stone-500">
                          ({categoryCards.length})
                        </div>
                      </div>
                    </div>

                    {/* カードスタック表示（スワイプ対応・さらに大きなズレ） */}
                    <div 
                      className="card-stack-area relative select-none mx-auto"
                      style={{ 
                        perspective: '1200px',
                        height: '400px',
                        width: '400px'
                      }}
                      onTouchStart={(e) => handleSwipeStart(e, category)}
                      onTouchMove={handleSwipeMove}
                      onTouchEnd={handleSwipeEnd}
                    >
                      {categoryCards.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-stone-400 text-center">
                            <div className="text-lg mb-2">No cards</div>
                            <div className="text-sm">Add a new task</div>
                          </div>
                        </div>
                      ) : (
                        categoryCards.map((card, cardIndex) => {
                          // スワイプ対応の位置計算（さらに大きなズレ）
                          const relativeIndex = cardIndex - scrollPosition;
                          const isVisible = relativeIndex >= 0 && relativeIndex < 6; // 最大6枚表示
                          
                          if (!isVisible) return null;
                          
                          /*
                            IMPORTANT: 存在しているカードは透過しません
                            カードの重なりは先頭カードの右上と2番目カードの左下が重なるように配置
                            後ろのカードは先頭カードよりも上側に位置します
                            カードのズレをさらに大きくして、各カードの内容がよく見えるようにします
                          */
                          const xOffset = relativeIndex * 80; // 右方向にさらに大きくずらす（60→80）
                          const yOffset = -relativeIndex * 70; // 上方向にさらに大きくずらす（50→70）
                          const zOffset = -relativeIndex * 10; // 奥行きも大きく
                          
                          return (
                            <div key={card.id}>
                              <div
                                className={`card-content absolute w-48 h-32 rounded-lg shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                                  categoryConfig.bg
                                } ${categoryConfig.border} overflow-hidden`}
                                style={{
                                  transform: `
                                    rotateX(15deg) 
                                    translateX(${xOffset}px)
                                    translateY(${yOffset + 150}px) 
                                    translateZ(${zOffset}px)
                                  `,
                                  opacity: 1, // 透過しない
                                  zIndex: 100 - relativeIndex,
                                  transformOrigin: 'center bottom'
                                }}
                                onClick={() => {
                                  const originalCardIndex = columns[selectedColumn].cards.findIndex(c => c.id === card.id);
                                  editCard(selectedColumn, originalCardIndex);
                                }}
                              >
                                {/* カード上半分 - カード内容エリア */}
                                <div className="absolute top-0 left-0 right-0 h-2/3 p-4 flex flex-col">
                                  {/* カード番号を左上に表示（全てのカードに表示） */}
                                  <div className={`absolute top-2 left-2 text-xs ${
                                    categoryConfig.bg === 'bg-stone-100' ? 'text-black' : 'opacity-75'
                                  }`}>
                                    {cardIndex + 1}
                                  </div>
                                  
                                  <div className={`text-sm font-medium overflow-hidden ${categoryConfig.text} flex-1 flex items-center justify-center text-center`}>
                                    {card.content || 'Empty card'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 下側スライドバー（列内容表示画面のみ） */}
      {selectedColumn !== null && (
        <div 
          className={`fixed bottom-2 left-0 right-0 z-40 transition-all duration-300 ${
            showSlideBar ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onTouchStart={showSlideBarTemporarily}
          onClick={showSlideBarTemporarily}
        >
          <div className="flex justify-center">
            <div className="bg-stone-500 bg-opacity-80 rounded-full px-6 py-2 flex items-center gap-4 shadow-lg">
              <button
                onClick={() => handleSlideBarChange('prev')}
                disabled={selectedColumn === 0}
                className={`p-2 rounded-full transition-colors ${
                  selectedColumn === 0 
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                    : 'bg-white text-stone-700'
                }`}
              >
                <ArrowLeft size={16} />
              </button>
              
              <div className="text-white text-sm font-medium min-w-max">
                {selectedColumn + 1} / {columns.length}
              </div>
              
              <button
                onClick={() => handleSlideBarChange('next')}
                disabled={selectedColumn === columns.length - 1}
                className={`p-2 rounded-full transition-colors ${
                  selectedColumn === columns.length - 1 
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                    : 'bg-white text-stone-700'
                }`}
              >
                <ArrowLeft size={16} className="transform rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 設定パネル */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-stone-200 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-stone-800">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-full bg-stone-50 border border-stone-300 shadow-sm"
              >
                <X size={20} className="text-stone-700" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3 text-stone-700">Status Color Settings</h3>
                {Object.entries(labelSettings).map(([key, config]) => (
                  <div key={key} className="mb-4">
                    <div className="flex items-center justify-center gap-3">
                      <span 
                        className={`text-sm font-medium w-20 text-center transition-all whitespace-nowrap ${
                          showColorPicker && showColorPicker !== key 
                            ? 'text-stone-400 opacity-60 filter sepia-[0.8] saturate-50' 
                            : 'text-stone-700'
                        }`}
                      >
                        {config.name}
                      </span>
                      <div 
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer shadow-sm flex items-center justify-center transition-all ${
                          showColorPicker && showColorPicker !== key 
                            ? 'opacity-60 filter sepia-[0.8] saturate-50' 
                            : ''
                        } ${config.bg} ${config.border}`}
                        onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                      />
                    </div>
                    
                    {/* 円形配置の色選択パネル */}
                    {showColorPicker === key && (
                      <div className="mt-3 relative">
                        <div 
                          className="bg-stone-50 border border-stone-200 rounded-lg p-4 shadow-lg"
                          style={{ height: '200px', position: 'relative' }}
                        >
                          {colorOptions.map((color, index) => {
                            const position = getCirclePosition(index, colorOptions.length);
                            return (
                              <div
                                key={color.name}
                                className={`absolute w-6 h-6 rounded-full border-2 ${color.bg} ${color.border} cursor-pointer shadow-sm transition-transform`}
                                style={{
                                  left: `${position.x}px`,
                                  top: `${position.y}px`,
                                  transform: 'translate(-50%, -50%)'
                                }}
                                onClick={() => selectColor(key, color)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 border border-stone-200 shadow-xl">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Delete Confirmation</h3>
            <p className="text-stone-600 mb-6">
              {deleteTarget?.type === 'card' ? (
                'Do you want to delete this card?'
              ) : (
                <>
                  Do you want to delete <span className="font-bold text-red-600">"{columns[deleteTarget?.data]?.name}"</span>?
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg transition-colors font-medium shadow-sm"
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-stone-300 text-stone-700 py-2 px-4 rounded-lg transition-colors font-medium shadow-sm"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSSアニメーション */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CardFlowApp;