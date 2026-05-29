import React, { useState, useEffect } from 'react'

const EMPTY_DISH = { name: '', description: '', price: '', image: '', category: '其他', available: 1 }

export default function AdminDishes({ token }) {
  const [dishes, setDishes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_DISH)

  const headers = { 'Authorization': `Basic ${token}`, 'Content-Type': 'application/json' }

  const load = () => {
    fetch('/api/admin/dishes', { headers }).then(r => r.json()).then(setDishes)
  }

  useEffect(load, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_DISH)
    setShowModal(true)
  }

  const openEdit = dish => {
    setEditing(dish.id)
    setForm({ ...dish, price: String(dish.price) })
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const body = { ...form, price: parseFloat(form.price) }
    if (editing) {
      await fetch(`/api/admin/dishes/${editing}`, { method: 'PUT', headers, body: JSON.stringify(body) })
    } else {
      await fetch('/api/admin/dishes', { method: 'POST', headers, body: JSON.stringify(body) })
    }
    setShowModal(false)
    load()
  }

  const handleDelete = async id => {
    if (!confirm('确定删除该菜品？')) return
    await fetch(`/api/admin/dishes/${id}`, { method: 'DELETE', headers })
    load()
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>菜品管理</h3>
          <button onClick={openAdd} style={{ background: '#ff4d4f', color: 'white', padding: '8px 16px', borderRadius: 6, fontSize: 14 }}>+ 添加菜品</button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>名称</th><th>分类</th><th>价格</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.name}</td>
                <td>{d.category}</td>
                <td>¥{d.price}</td>
                <td>{d.available ? '✅ 上架' : '❌ 下架'}</td>
                <td>
                  <button className="btn-sm btn-edit" onClick={() => openEdit(d)}>编辑</button>
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(d.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? '编辑菜品' : '添加菜品'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>名称</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>描述</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>价格</label>
                <input type="number" step="0.1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>分类</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="form-group">
                <label>图片URL</label>
                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.available === 1} onChange={e => setForm({ ...form, available: e.target.checked ? 1 : 0 })} />
                  上架
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn-confirm">{editing ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}